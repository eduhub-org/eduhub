// @ts-check
import { GraphQLClient } from 'graphql-request';
import { hasuraConfig } from './config.js';

/**
 * GraphQL client for Hasura with the admin secret. Throws when
 * HASURA_ENDPOINT or HASURA_ADMIN_SECRET is not set, so a misconfigured
 * unit fails loudly instead of querying Hasura as an anonymous caller.
 * @returns {GraphQLClient}
 */
export function createHasuraClient() {
  const { endpoint, adminSecret } = hasuraConfig();
  return new GraphQLClient(endpoint, {
    headers: { 'x-hasura-admin-secret': adminSecret },
  });
}
