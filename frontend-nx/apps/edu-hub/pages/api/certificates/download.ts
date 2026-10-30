import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { GraphQLClient, gql } from 'graphql-request';
import { AuthRoles } from '../../../types/enums';
import {
  OPEN_SESSION_QUERY,
  OpenSessionResult,
  adminClient,
  readImpersonationCookie,
  resolveAdminCaller,
} from '../../../helpers/impersonation';

type ErrorResponse = {
  error: string;
};

type HasuraClaims = {
  'x-hasura-allowed-roles'?: string[];
};

type SessionToken = {
  accessToken?: string;
  profile?: {
    'https://hasura.io/jwt/claims'?: HasuraClaims;
  };
};

type GetSignedUrlResponse = {
  getSignedUrl?: {
    link?: string | string[] | null;
  } | null;
};

const GRAPHQL_URI = process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql';

const GET_SIGNED_URL_QUERY = gql`
  query GetSignedUrl($path: String!) {
    getSignedUrl(path: $path) {
      link
    }
  }
`;

const getSingleQueryParam = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] : value
);

const CERTIFICATE_PATH_PATTERN = /^[A-Za-z0-9/_-]+\.pdf$/i;

const isPdfPath = (path: string) => (
  path.split('?')[0].toLowerCase().endsWith('.pdf')
);

const isSafeStoragePath = (path: string) => (
  !path.startsWith('/') &&
  !path.includes('\0') &&
  !path.includes('..') &&
  !/^[a-z][a-z0-9+.-]*:\/\//i.test(path) &&
  CERTIFICATE_PATH_PATTERN.test(path)
);

/**
 * The user a super-admin is currently viewing as, or null.
 *
 * Re-runs the same checks as the impersonation GraphQL proxy (signed cookie,
 * admin caller, still-open session) so the download link behaves exactly as it
 * would for that person: if their certificate does not open for them, it does
 * not open here either, which is the point of viewing as them.
 */
const resolveImpersonatedUserId = async (req: NextApiRequest): Promise<string | null> => {
  const payload = readImpersonationCookie(req);
  if (!payload) return null;

  const admin = await resolveAdminCaller(req);
  if (!admin) return null;

  const open = await adminClient().request<OpenSessionResult>(OPEN_SESSION_QUERY, {
    id: payload.sessionId,
    adminUserId: admin.userId,
  });
  const session = open.ImpersonationSession[0];
  if (!session || session.targetUserId !== payload.targetUserId) return null;

  return payload.targetUserId;
};

const getPreferredRole = (claims?: HasuraClaims): AuthRoles | null => {
  const allowedRoles = claims?.['x-hasura-allowed-roles'] ?? [];

  if (allowedRoles.includes(AuthRoles.admin)) return AuthRoles.admin;
  if (allowedRoles.includes(AuthRoles.instructor)) return AuthRoles.instructor;
  if (allowedRoles.includes(AuthRoles.user)) return AuthRoles.user;

  return null;
};

export default async function certificateDownload(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const certificatePath = getSingleQueryParam(req.query.path);
  if (!certificatePath || !isPdfPath(certificatePath) || !isSafeStoragePath(certificatePath)) {
    return res.status(400).json({ error: 'Invalid certificate path.' });
  }

  const token = await getToken({ req }) as SessionToken | null;
  const accessToken = token?.accessToken;
  const claims = token?.profile?.['https://hasura.io/jwt/claims'];
  const role = getPreferredRole(claims);

  if (!accessToken || !role) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const impersonatedUserId = await resolveImpersonatedUserId(req);
    const graphQLClient = new GraphQLClient(GRAPHQL_URI, {
      headers: impersonatedUserId
        ? {
            'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
            'x-hasura-role': AuthRoles.user,
            'x-hasura-user-id': impersonatedUserId,
          }
        : {
            Authorization: `Bearer ${accessToken}`,
            'x-hasura-role': role,
          },
    });

    const result = await graphQLClient.request<GetSignedUrlResponse>(
      GET_SIGNED_URL_QUERY,
      { path: certificatePath }
    );

    const link = result.getSignedUrl?.link;
    // Older signed-URL responses may wrap the URL in a single-element array; normalize to a
    // string so res.redirect (which rejects non-string URLs) does not throw.
    const signedUrl = Array.isArray(link) ? link[0] : link;
    if (!signedUrl) {
      if (impersonatedUserId) {
        // Ids only, as in the impersonation audit lines.
        console.info('Certificate not signed for impersonated user', { targetUserId: impersonatedUserId });
      }
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('Certificate download failed:', error);
    return res.status(500).json({ error: 'Certificate download failed.' });
  }
}
