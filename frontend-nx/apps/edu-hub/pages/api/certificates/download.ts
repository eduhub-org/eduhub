import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { GraphQLClient, gql } from 'graphql-request';
import { AuthRoles } from '../../../types/enums';

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
    link?: string | null;
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
    const graphQLClient = new GraphQLClient(GRAPHQL_URI, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-hasura-role': role,
      },
    });

    const result = await graphQLClient.request<GetSignedUrlResponse>(
      GET_SIGNED_URL_QUERY,
      { path: certificatePath }
    );

    const signedUrl = result.getSignedUrl?.link;
    if (!signedUrl) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('Certificate download failed:', error);
    return res.status(500).json({ error: 'Certificate download failed.' });
  }
}
