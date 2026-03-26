import axios from 'axios';
import { gql, GraphQLClient } from 'graphql-request';
import crypto from 'crypto';

const USER_DRIVEN_SOURCES = new Set(['CHECKBOX', 'PROFILE', 'ADMIN']);

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const KEY_LENGTH_BYTES = 32;

const isSubscribedLikeStatus = (status) => status === 'SUBSCRIBED' || status === 'PENDING';

const hasGhostConfiguration = (organization) =>
  Boolean(
    normalize(organization?.ghostNewsletterApiUrl) &&
      normalize(organization?.ghostNewsletterApiKeyEncrypted) &&
      (normalize(organization?.ghostNewsletterListId) || normalize(organization?.ghostNewsletterSlug))
  );

const decodeEncryptionKey = () => {
  const raw = normalize(process.env.GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY);
  if (!raw) {
    throw new Error('Missing GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY');
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const base64Key = Buffer.from(raw, 'base64');
  if (base64Key.length === KEY_LENGTH_BYTES) {
    return base64Key;
  }

  throw new Error(
    'Invalid GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY format. Use 64-char hex or base64-encoded 32-byte key.'
  );
};

const decryptGhostCredential = (encryptedValue) => {
  const payload = normalize(encryptedValue);
  if (!payload) {
    throw new Error('Ghost credential is missing');
  }

  const [version, ivBase64, authTagBase64, ciphertextBase64] = payload.split(':');
  if (version !== 'v1' || !ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error('Ghost credential payload has invalid format');
  }

  const key = decodeEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  const credential = normalize(plaintext);

  if (!credential) {
    throw new Error('Ghost credential is empty after decryption');
  }

  return credential;
};

const buildGhostPayload = ({ subscription, userEmail, subscribe }) => {
  const organization = subscription.Organization;
  return {
    email: userEmail,
    action: subscribe ? 'subscribe' : 'unsubscribe',
    listId: normalize(organization.ghostNewsletterListId) || null,
    slug: normalize(organization.ghostNewsletterSlug) || null,
    externalSubscriberId: normalize(subscription.externalSubscriberId) || null,
    doubleOptInEnabled: Boolean(organization.ghostNewsletterDoubleOptInEnabled),
  };
};

const MAX_GHOST_SYNC_RETRIES = 3;

const extractGhostHttpError = (response) =>
  response.data?.errors?.[0]?.message ||
  response.data?.message ||
  `Ghost sync request failed with status ${response.status}`;

const callGhostSyncEndpoint = async ({ subscription, userEmail, subscribe }) => {
  const apiUrl = normalize(subscription.Organization.ghostNewsletterApiUrl).replace(/\/+$/, '');
  const ghostCredential = decryptGhostCredential(subscription.Organization.ghostNewsletterApiKeyEncrypted);
  const endpoint = `${apiUrl}/members/`;
  const payload = buildGhostPayload({ subscription, userEmail, subscribe });

  let lastError;
  for (let attempt = 0; attempt < MAX_GHOST_SYNC_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(endpoint, payload, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Ghost ${ghostCredential}`,
          'x-ghost-api-key': ghostCredential,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        const responseError = extractGhostHttpError(response);
        const retriable = response.status >= 500 || response.status === 429;
        if (retriable && attempt < MAX_GHOST_SYNC_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
          lastError = new Error(responseError);
          continue;
        }
        throw new Error(responseError);
      }

      return {
        externalSubscriberId:
          response.data?.member?.id ||
          response.data?.id ||
          response.data?.externalSubscriberId ||
          payload.externalSubscriberId ||
          null,
        remoteStatus: response.data?.status || null,
      };
    } catch (err) {
      const isNetwork =
        !err.response &&
        (err.code === 'ECONNABORTED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNRESET' ||
          err.message === 'Network Error');
      if (isNetwork && attempt < MAX_GHOST_SYNC_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Ghost sync failed after retries');
};

const ALLOWED_REMOTE_STATUSES = new Set(['SUBSCRIBED', 'UNSUBSCRIBED', 'PENDING', 'ERROR']);

const normalizeRemoteSubscriptionStatus = (remoteStatus, fallbackStatus) => {
  const normalized = typeof remoteStatus === 'string' ? remoteStatus.trim().toUpperCase() : '';
  if (normalized && ALLOWED_REMOTE_STATUSES.has(normalized)) {
    return normalized;
  }
  return fallbackStatus;
};

const getRequiredEnv = (name) => {
  const value = normalize(process.env[name]);
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const getGraphqlClient = () =>
  new GraphQLClient(getRequiredEnv('HASURA_ENDPOINT'), {
    headers: {
      'x-hasura-admin-secret': getRequiredEnv('HASURA_ADMIN_SECRET'),
    },
  });

const GET_SUBSCRIPTION_DETAILS = gql`
  query GetOrganizationNewsletterSubscriptionDetails($userId: uuid!, $organizationId: Int!) {
    OrganizationNewsletterSubscription_by_pk(userId: $userId, organizationId: $organizationId) {
      userId
      organizationId
      status
      source
      externalSubscriberId
      Organization {
        id
        name
        newsletterProvider
        ghostNewsletterApiUrl
        ghostNewsletterApiKeyEncrypted
        ghostNewsletterListId
        ghostNewsletterSlug
        ghostNewsletterDoubleOptInEnabled
      }
      User {
        id
        email
      }
    }
  }
`;

const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateOrganizationNewsletterSubscriptionAfterSync(
    $userId: uuid!
    $organizationId: Int!
    $status: String!
    $externalSubscriberId: String
    $lastSyncedAt: timestamptz!
    $source: String!
    $errorMessage: String
  ) {
    update_OrganizationNewsletterSubscription_by_pk(
      pk_columns: { userId: $userId, organizationId: $organizationId }
      _set: {
        status: $status
        externalSubscriberId: $externalSubscriberId
        lastSyncedAt: $lastSyncedAt
        source: $source
        errorMessage: $errorMessage
      }
    ) {
      userId
      organizationId
      status
      source
    }
  }
`;

const updateSubscriptionState = async (client, payload) =>
  client.request(UPDATE_SUBSCRIPTION, {
    ...payload,
    lastSyncedAt: new Date().toISOString(),
  });

export default async function syncGhostNewsletterSubscription(req, logger) {
  const startedAt = Date.now();
  const logContext = (extra = {}) => ({
    function: 'syncGhostNewsletterSubscription',
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    ...extra,
  });

  try {
    const event = req.body?.event;
    const newRow = event?.data?.new;
    const op = event?.op;

    if (!event || !newRow || (op !== 'INSERT' && op !== 'UPDATE')) {
      return {
        success: true,
        messageKey: 'NO_ACTION_NEEDED',
        message: 'No actionable event payload found',
      };
    }

    if (!newRow.userId || !newRow.organizationId) {
      return {
        success: false,
        messageKey: 'INVALID_EVENT_PAYLOAD',
        error: 'Missing userId or organizationId in event payload',
      };
    }

    const client = getGraphqlClient();
    const detailsResult = await client.request(GET_SUBSCRIPTION_DETAILS, {
      userId: newRow.userId,
      organizationId: newRow.organizationId,
    });

    const subscription = detailsResult?.OrganizationNewsletterSubscription_by_pk;
    if (!subscription) {
      return {
        success: false,
        messageKey: 'SUBSCRIPTION_NOT_FOUND',
        error: 'Newsletter subscription row not found',
      };
    }

    if (subscription.source === 'WEBHOOK') {
      return {
        success: true,
        messageKey: 'SOURCE_WEBHOOK_SKIPPED',
        message: 'Skipping self-triggered sync update',
      };
    }

    if (!USER_DRIVEN_SOURCES.has(subscription.source)) {
      return {
        success: true,
        messageKey: 'SOURCE_NOT_SYNCED',
        message: `No sync needed for source ${subscription.source}`,
      };
    }

    if (subscription.Organization?.newsletterProvider !== 'GHOST') {
      await updateSubscriptionState(client, {
        userId: subscription.userId,
        organizationId: subscription.organizationId,
        status: 'ERROR',
        source: 'WEBHOOK',
        externalSubscriberId: subscription.externalSubscriberId || null,
        errorMessage: 'Unsupported newsletter provider configured',
      });

      return {
        success: false,
        messageKey: 'UNSUPPORTED_PROVIDER',
        error: 'Unsupported newsletter provider configured',
      };
    }

    if (!hasGhostConfiguration(subscription.Organization)) {
      await updateSubscriptionState(client, {
        userId: subscription.userId,
        organizationId: subscription.organizationId,
        status: 'ERROR',
        source: 'WEBHOOK',
        externalSubscriberId: subscription.externalSubscriberId || null,
        errorMessage: 'Ghost newsletter configuration is incomplete',
      });

      return {
        success: false,
        messageKey: 'GHOST_CONFIGURATION_MISSING',
        error: 'Ghost newsletter configuration is incomplete',
      };
    }

    if (!subscription.User?.email) {
      await updateSubscriptionState(client, {
        userId: subscription.userId,
        organizationId: subscription.organizationId,
        status: 'ERROR',
        source: 'WEBHOOK',
        externalSubscriberId: subscription.externalSubscriberId || null,
        errorMessage: 'User email is missing',
      });

      return {
        success: false,
        messageKey: 'USER_EMAIL_MISSING',
        error: 'User email is missing',
      };
    }

    const subscribe = isSubscribedLikeStatus(subscription.status);

    const ghostResult = await callGhostSyncEndpoint({
      subscription,
      userEmail: subscription.User.email,
      subscribe,
    });

    const syncedStatus = subscribe
      ? subscription.Organization.ghostNewsletterDoubleOptInEnabled
        ? 'PENDING'
        : 'SUBSCRIBED'
      : 'UNSUBSCRIBED';

    const sanitizedRemoteStatus = normalizeRemoteSubscriptionStatus(ghostResult.remoteStatus, syncedStatus);

    await updateSubscriptionState(client, {
      userId: subscription.userId,
      organizationId: subscription.organizationId,
      status: sanitizedRemoteStatus,
      source: 'WEBHOOK',
      externalSubscriberId: ghostResult.externalSubscriberId,
      errorMessage: null,
    });

    logger.info(
      logContext({
        success: true,
        messageKey: 'GHOST_SYNC_SUCCESS',
        recipientEmail: subscription.User.email,
        organizationName: subscription.Organization?.name,
        organizationId: subscription.organizationId,
        userId: subscription.userId,
        newsletterProvider: subscription.Organization?.newsletterProvider,
        subscriptionStatus: sanitizedRemoteStatus,
      })
    );

    return {
      success: true,
      messageKey: 'GHOST_SYNC_SUCCESS',
      userId: subscription.userId,
      organizationId: subscription.organizationId,
      status: sanitizedRemoteStatus,
    };
  } catch (error) {
    const userId = req.body?.event?.data?.new?.userId;
    const organizationId = req.body?.event?.data?.new?.organizationId;

    logger.error(
      logContext({
        success: false,
        messageKey: 'GHOST_SYNC_FAILED',
        userId,
        organizationId,
        errorMessage: error.message,
        errorStack: error.stack,
      })
    );

    if (userId && organizationId) {
      try {
        const client = getGraphqlClient();
        await updateSubscriptionState(client, {
          userId,
          organizationId,
          status: 'ERROR',
          source: 'WEBHOOK',
          externalSubscriberId: null,
          errorMessage: error.message || 'Unexpected synchronization error',
        });
      } catch (updateError) {
        logger.error(
          logContext({
            success: false,
            messageKey: 'GHOST_SYNC_ERROR_PERSIST_FAILED',
            errorMessage: updateError.message,
            errorStack: updateError.stack,
          })
        );
      }
    }

    return {
      success: false,
      messageKey: 'GHOST_SYNC_FAILED',
      error: error.message,
    };
  }
}
