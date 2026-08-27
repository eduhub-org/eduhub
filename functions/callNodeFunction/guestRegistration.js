import crypto from 'node:crypto';
import { gql, GraphQLClient } from 'graphql-request';
import { escapeHtml } from './emailTemplateVariables.js';

/**
 * Shared helpers for account-less ("guest") event registration.
 *
 * A guest is an ordinary `User` row with `status = 'GUEST'` and no Keycloak
 * account. That choice is what keeps this feature small: enrollment, every
 * transactional mail, session reminders and newsletter opt-in all key off
 * `User.id` and therefore work unchanged. What a guest lacks is a login, so
 * everything they need to do afterwards -- confirm, cancel, erase -- is
 * authenticated by a token emailed to them instead.
 *
 * Two token kinds, deliberately different:
 *
 *   confirmation  Random, stored hashed in `GuestRegistrationToken`, single use,
 *                 7 days. It carries pending state (which course, whether the
 *                 marketing box was ticked), so it has to be a row.
 *
 *   manage        Stateless HMAC over the user id. Carries no state, so there is
 *                 nothing to store -- which means any mailer can regenerate the
 *                 link without the platform ever holding a replayable
 *                 credential. The trade-off is that an individual manage link
 *                 cannot be revoked; it stops working when the guest record is
 *                 anonymized, which is the only revocation this needs.
 */

export const CONFIRM_TOKEN_TTL_DAYS = 7;

const DEFAULT_FRONTEND_URL = 'https://edu.opencampus.sh';

/** Registration types a guest may use. Approval workflows and paid courses are
 *  deliberately excluded: the former needs an admin decision the guest cannot
 *  see, the latter drags in Stripe, invoices and statutory retention periods
 *  that conflict with the guest deletion schedule. */
export const GUEST_ALLOWED_REGISTRATION_TYPES = new Set([
  'DIRECT_CONFIRMATION',
  'DIRECT_WITH_INPUT',
]);

export function getFrontendUrl() {
  return (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
}

export function createHasuraClient() {
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error('HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured');
  }
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
}

/* ------------------------------------------------ confirmation tokens */

/** Raw token handed to the guest in a link. 32 bytes of CSPRNG output, url-safe. */
export function generateRawToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/** Only the hash is persisted, so a database read yields no working links. */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken), 'utf8').digest('hex');
}

const INSERT_CONFIRM_TOKEN = gql`
  mutation InsertGuestRegistrationToken(
    $tokenHash: String!
    $userId: uuid!
    $courseId: Int!
    $expiresAt: timestamptz!
    $newsletterOptIn: Boolean!
  ) {
    insert_GuestRegistrationToken_one(
      object: {
        tokenHash: $tokenHash
        userId: $userId
        courseId: $courseId
        expiresAt: $expiresAt
        newsletterOptIn: $newsletterOptIn
      }
    ) {
      id
    }
  }
`;

const FIND_CONFIRM_TOKEN = gql`
  query FindGuestRegistrationToken($tokenHash: String!) {
    GuestRegistrationToken(where: { tokenHash: { _eq: $tokenHash } }, limit: 1) {
      id
      userId
      courseId
      newsletterOptIn
      expiresAt
      usedAt
      User {
        id
        firstName
        lastName
        email
        status
      }
    }
  }
`;

const MARK_CONFIRM_TOKEN_USED = gql`
  mutation MarkGuestRegistrationTokenUsed($id: uuid!) {
    update_GuestRegistrationToken_by_pk(
      pk_columns: { id: $id }
      _set: { usedAt: "now()" }
    ) {
      id
    }
  }
`;

export async function issueConfirmToken(client, userId, courseId, newsletterOptIn = false) {
  const rawToken = generateRawToken();
  const expiresAt = new Date(
    Date.now() + CONFIRM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  await client.request(INSERT_CONFIRM_TOKEN, {
    tokenHash: hashToken(rawToken),
    userId,
    courseId,
    expiresAt,
    newsletterOptIn: Boolean(newsletterOptIn),
  });
  return rawToken;
}

/**
 * Resolves a raw confirmation token, rejecting anything expired or already
 * spent. Returns `{ ok: false, messageKey }` rather than throwing so callers can
 * answer uniformly for every bad-token case.
 */
export async function resolveConfirmToken(client, rawToken) {
  if (typeof rawToken !== 'string' || rawToken.trim() === '') {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }

  const data = await client.request(FIND_CONFIRM_TOKEN, { tokenHash: hashToken(rawToken) });
  const token = data?.GuestRegistrationToken?.[0];

  if (!token) {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }
  if (new Date(token.expiresAt) <= new Date()) {
    return { ok: false, messageKey: 'TOKEN_EXPIRED' };
  }
  if (token.usedAt) {
    return { ok: false, messageKey: 'TOKEN_ALREADY_USED' };
  }
  // An erased guest keeps no usable token.
  if (token.User?.status === 'DELETED') {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }

  return { ok: true, token };
}

export async function markConfirmTokenUsed(client, tokenId) {
  await client.request(MARK_CONFIRM_TOKEN_USED, { id: tokenId });
}

/* -------------------------------------------------------- manage tokens */

function getManageTokenSecret() {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret || secret.trim() === '') {
    // Failing loudly beats deriving links from a default secret: a predictable
    // secret would let anyone mint a manage link for any guest.
    throw new Error('GUEST_TOKEN_SECRET is not configured');
  }
  return secret;
}

function signUserId(userId) {
  return crypto
    .createHmac('sha256', getManageTokenSecret())
    .update(`MANAGE:${userId}`, 'utf8')
    .digest('base64url');
}

/** Deterministic, so every mailer can regenerate the same link for a guest. */
export function buildManageToken(userId) {
  return `${userId}.${signUserId(userId)}`;
}

/**
 * Verifies a manage token and returns the user id it names, or null. The
 * signature is compared in constant time; a mismatched length is treated as a
 * plain mismatch rather than allowed to short-circuit.
 */
export function verifyManageToken(token) {
  if (typeof token !== 'string') return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const userId = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);

  let expectedSignature;
  try {
    expectedSignature = signUserId(userId);
  } catch {
    return null;
  }

  const provided = crypto.createHash('sha256').update(providedSignature, 'utf8').digest();
  const expected = crypto.createHash('sha256').update(expectedSignature, 'utf8').digest();

  return crypto.timingSafeEqual(provided, expected) ? userId : null;
}

/* -------------------------------------------------------------------- links */

export function buildConfirmLink(rawToken) {
  return `${getFrontendUrl()}/guest/confirm?token=${encodeURIComponent(rawToken)}`;
}

export function buildManageLink(userId) {
  return `${getFrontendUrl()}/guest/manage?token=${encodeURIComponent(buildManageToken(userId))}`;
}

export function buildCourseLink(courseId) {
  return `${getFrontendUrl()}/course/${courseId}`;
}

export function buildPrivacyPolicyLink() {
  return `${getFrontendUrl()}/privacy`;
}

/* ------------------------------------------------------------------- emails */

const GET_TEMPLATE = gql`
  query GetGuestMailTemplate($type: MailTemplateType_enum!) {
    MailTemplate(
      where: { _and: [{ type: { _eq: $type } }, { courseId: { _is_null: true } }] }
      limit: 1
    ) {
      subject
      content
      from
      cc
      bcc
    }
  }
`;

const INSERT_MAIL_LOG = gql`
  mutation InsertGuestMailLog(
    $subject: String!
    $content: String!
    $from: String!
    $to: String!
    $cc: String
    $bcc: String
    $status: String!
    $metadata: jsonb
  ) {
    insert_MailLog_one(
      object: {
        subject: $subject
        content: $content
        from: $from
        to: $to
        cc: $cc
        bcc: $bcc
        status: $status
        metadata: $metadata
      }
    ) {
      id
    }
  }
`;

/**
 * Substitutes `[Guest:*]` and `[User:*]` placeholders. Values are HTML-escaped
 * in the body but not in the subject, mirroring `createVariableReplacer`.
 */
function replaceGuestVariables(text, values, { html = true } = {}) {
  if (!text) return '';
  const escape = html ? escapeHtml : (v) => (v == null ? '' : String(v));
  return Object.entries(values).reduce(
    (acc, [placeholder, value]) => acc.replaceAll(placeholder, escape(value)),
    text
  );
}

/**
 * Renders a guest template and queues it. `metadata` follows the same jsonb
 * convention the cron mailers use, so guest mail is greppable in MailLog
 * alongside everything else.
 */
export async function queueGuestMail(client, logger, { templateType, to, values, metadata }) {
  const templateData = await client.request(GET_TEMPLATE, { type: templateType });
  const template = templateData?.MailTemplate?.[0];

  if (!template) {
    logger.error(`Guest email template not found: ${templateType}`);
    return { success: false, messageKey: 'TEMPLATE_NOT_FOUND' };
  }

  const result = await client.request(INSERT_MAIL_LOG, {
    subject: replaceGuestVariables(template.subject, values, { html: false }),
    content: replaceGuestVariables(template.content, values),
    from: template.from || 'noreply@opencampus.sh',
    to,
    cc: template.cc,
    bcc: template.bcc,
    status: 'READY_TO_SEND',
    metadata: metadata ?? null,
  });

  logger.info(`Queued guest email ${templateType}, mailId: ${result.insert_MailLog_one.id}`);
  return { success: true, mailId: result.insert_MailLog_one.id };
}

/**
 * Footer appended to the standard lifecycle mails when the recipient is a guest.
 * Regular users manage their registrations from their account; a guest has no
 * account, so this link is their only route to their own data. Bilingual to
 * match the templates it is appended to.
 */
export function buildGuestMailFooter(userId) {
  const manageLink = buildManageLink(userId);
  return `
<hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
<p style="font-size: 0.9em; color: #666;">
  Du bist als Gast angemeldet. Über diesen Link kannst du deine Anmeldung ansehen,
  stornieren oder deine Daten löschen lassen:
  <a href="${manageLink}">Anmeldung verwalten</a>
</p>
<p style="font-size: 0.9em; color: #666;">
  You are registered as a guest. Use this link to view or cancel your registration,
  or to have your data deleted:
  <a href="${manageLink}">Manage registration</a>
</p>`;
}

/* ---------------------------------------------------------------- settings */

const GET_APP_SETTINGS = gql`
  query GetGuestAppSettings {
    AppSettings(limit: 1) {
      guestDataRetentionMonths
    }
  }
`;

export async function getGuestRetentionMonths(client) {
  const data = await client.request(GET_APP_SETTINGS);
  return data?.AppSettings?.[0]?.guestDataRetentionMonths ?? 12;
}

/* -------------------------------------------------------------- validation */

/**
 * Intentionally permissive: this is a sanity check, not an attempt to decide
 * whether an address is deliverable. Double opt-in is what actually establishes
 * that the address exists and belongs to the person using the form.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && email.length <= 254;
}

export function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidName(name) {
  return name.length >= 1 && name.length <= 100;
}
