import type { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { encryptGhostNewsletterCredential } from '../../../helpers/ghostNewsletterCredentialCrypto';

type ResponseBody =
  | { success: true; configured: boolean }
  | { success: false; error: string };

const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;
const GRAPHQL_URI = process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql';
const ENCRYPTION_KEY = process.env.GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY || '';

if (!HASURA_ADMIN_SECRET) {
  throw new Error('HASURA_ADMIN_SECRET environment variable is required but not set.');
}

const CAN_MANAGE_ORGANIZATION_QUERY = gql`
  query CanManageOrganization($organizationId: Int!) {
    Organization(where: { id: { _eq: $organizationId } }) {
      id
    }
  }
`;

const UPDATE_GHOST_CREDENTIAL_MUTATION = gql`
  mutation UpdateOrganizationGhostCredential(
    $organizationId: Int!
    $ghostNewsletterApiKeyEncrypted: String
    $ghostNewsletterApiKeyConfigured: Boolean!
  ) {
    update_Organization_by_pk(
      pk_columns: { id: $organizationId }
      _set: {
        ghostNewsletterApiKeyEncrypted: $ghostNewsletterApiKeyEncrypted
        ghostNewsletterApiKeyConfigured: $ghostNewsletterApiKeyConfigured
      }
    ) {
      id
      ghostNewsletterApiKeyConfigured
    }
  }
`;

export default async function manageGhostNewsletterCredential(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing bearer token.' });
  }

  const organizationId = Number(req.body?.organizationId);
  if (!Number.isInteger(organizationId) || organizationId < 0) {
    return res.status(400).json({ success: false, error: 'Invalid organizationId.' });
  }

  const rawCredential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
  const shouldConfigure = rawCredential.length > 0;

  if (shouldConfigure && rawCredential.length < 10) {
    return res.status(400).json({ success: false, error: 'Credential is too short.' });
  }

  try {
    const accessClient = new GraphQLClient(GRAPHQL_URI, {
      headers: {
        Authorization: authHeader,
        'x-hasura-role': 'user',
      },
    });

    const accessResult = await accessClient.request<{ Organization: Array<{ id: number }> }>(
      CAN_MANAGE_ORGANIZATION_QUERY,
      { organizationId }
    );

    if (!accessResult.Organization.length) {
      return res.status(403).json({ success: false, error: 'You are not allowed to manage this organization.' });
    }

    const encryptedCredential = shouldConfigure
      ? encryptGhostNewsletterCredential(rawCredential, ENCRYPTION_KEY)
      : null;

    const adminClient = new GraphQLClient(GRAPHQL_URI, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
    });

    await adminClient.request(UPDATE_GHOST_CREDENTIAL_MUTATION, {
      organizationId,
      ghostNewsletterApiKeyEncrypted: encryptedCredential,
      ghostNewsletterApiKeyConfigured: shouldConfigure,
    });

    return res.status(200).json({ success: true, configured: shouldConfigure });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected credential update error.',
    });
  }
}
