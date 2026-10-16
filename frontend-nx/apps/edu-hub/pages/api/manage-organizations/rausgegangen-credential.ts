import type { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { encryptOrganizationCredential } from '../../../helpers/organizationCredentialCrypto';

/**
 * Stores (or, with an empty credential, removes) an organization's Rausgegangen
 * API key, encrypted. Only the node functions ever decrypt it.
 *
 * Super admins only: the caller's own token must be valid for the `admin` role
 * (Hasura rejects the request otherwise), and the organization must have the
 * RAUSGEGANGEN feature, which only a super admin can activate.
 */

type ResponseBody = { success: true; configured: boolean } | { success: false; error: string };

const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || '';
const GRAPHQL_URI = process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql';
const ENCRYPTION_KEY = process.env.GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY || '';

const ORGANIZATION_WITH_FEATURE_QUERY = gql`
  query RausgegangenCredentialOrganization($organizationId: Int!) {
    Organization_by_pk(id: $organizationId) {
      id
      Features(where: { feature: { _eq: RAUSGEGANGEN } }) {
        id
      }
    }
  }
`;

const UPDATE_RAUSGEGANGEN_CREDENTIAL_MUTATION = gql`
  mutation UpdateOrganizationRausgegangenCredential(
    $organizationId: Int!
    $rausgegangenApiKeyEncrypted: String
    $rausgegangenApiKeyConfigured: Boolean!
  ) {
    update_Organization_by_pk(
      pk_columns: { id: $organizationId }
      _set: {
        rausgegangenApiKeyEncrypted: $rausgegangenApiKeyEncrypted
        rausgegangenApiKeyConfigured: $rausgegangenApiKeyConfigured
      }
    ) {
      id
    }
  }
`;

export default async function manageRausgegangenCredential(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!HASURA_ADMIN_SECRET) {
    return res.status(500).json({ success: false, error: 'Server is not configured.' });
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
  if (shouldConfigure && !ENCRYPTION_KEY) {
    return res.status(500).json({ success: false, error: 'Credential encryption is not configured.' });
  }

  let organization: { id: number; Features: { id: number }[] } | null;
  try {
    const callerClient = new GraphQLClient(GRAPHQL_URI, {
      headers: { Authorization: authHeader, 'x-hasura-role': 'admin' },
    });
    const result = await callerClient.request<{
      Organization_by_pk: { id: number; Features: { id: number }[] } | null;
    }>(ORGANIZATION_WITH_FEATURE_QUERY, { organizationId });
    organization = result.Organization_by_pk;
  } catch {
    // The token is not valid for the admin role (or has expired).
    return res.status(403).json({ success: false, error: 'Only super admins can manage this credential.' });
  }

  if (!organization) {
    return res.status(404).json({ success: false, error: 'Organization not found.' });
  }
  if (shouldConfigure && organization.Features.length === 0) {
    return res
      .status(403)
      .json({ success: false, error: 'The Rausgegangen feature is not activated for this organization.' });
  }

  try {
    const adminClient = new GraphQLClient(GRAPHQL_URI, {
      headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
    });
    await adminClient.request(UPDATE_RAUSGEGANGEN_CREDENTIAL_MUTATION, {
      organizationId,
      rausgegangenApiKeyEncrypted: shouldConfigure ? encryptOrganizationCredential(rawCredential, ENCRYPTION_KEY) : null,
      rausgegangenApiKeyConfigured: shouldConfigure,
    });
    return res.status(200).json({ success: true, configured: shouldConfigure });
  } catch (error) {
    console.error('manageRausgegangenCredential: credential update failed', error);
    return res.status(500).json({ success: false, error: 'Could not update credentials. Please try again.' });
  }
}
