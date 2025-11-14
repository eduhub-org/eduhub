import type { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import crypto from 'crypto';

interface ValidateApiKeyResponse {
  valid: boolean;
  organizationId?: number;
  organizationName?: string;
  error?: string;
}

const VALIDATE_API_KEY_QUERY = gql`
  query ValidateApiKey($orgId: Int!, $apiKeyHash: String!) {
    Organization(where: { id: { _eq: $orgId }, apiKeyHash: { _eq: $apiKeyHash } }) {
      id
      name
      type
    }
  }
`;

const validateApiKey = async (
  request: NextApiRequest,
  response: NextApiResponse<ValidateApiKeyResponse>
) => {
  if (request.method !== 'POST') {
    return response.status(405).json({
      valid: false,
      error: 'Method not allowed. Only POST is supported.',
    });
  }

  try {
    const { apiKey } = request.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return response.status(400).json({
        valid: false,
        error: 'API key is required',
      });
    }

    // Validate API key format: edh_live_org123_sk_abcdef1234567890
    if (!apiKey.startsWith('edh_live_org')) {
      return response.status(400).json({
        valid: false,
        error: 'Invalid API key format',
      });
    }

    // Extract organization ID from API key
    const parts = apiKey.split('_');
    if (parts.length < 3) {
      return response.status(400).json({
        valid: false,
        error: 'Invalid API key format',
      });
    }

    const orgPart = parts[2]; // org123
    const organizationId = parseInt(orgPart.replace('org', ''), 10);

    if (isNaN(organizationId)) {
      return response.status(400).json({
        valid: false,
        error: 'Invalid organization ID in API key',
      });
    }

    // Generate hash of the provided API key
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Query Hasura to validate API key
    const graphQLClient = new GraphQLClient(
      process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql',
      {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || 'myadminsecretkey',
        },
      }
    );

    const data = await graphQLClient.request(VALIDATE_API_KEY_QUERY, {
      orgId: organizationId,
      apiKeyHash,
    });

    const organizations = data.Organization;

    if (!organizations || organizations.length === 0) {
      return response.status(401).json({
        valid: false,
        error: 'Invalid API key or organization not found',
      });
    }

    const organization = organizations[0];

    return response.status(200).json({
      valid: true,
      organizationId: organization.id,
      organizationName: organization.name,
    });
  } catch (error) {
    console.error('API key validation error:', error);
    return response.status(500).json({
      valid: false,
      error: 'Internal server error during API key validation',
    });
  }
};

export default validateApiKey;

