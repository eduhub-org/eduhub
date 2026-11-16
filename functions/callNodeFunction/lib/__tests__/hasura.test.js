import { afterEach, describe, expect, it, jest } from '@jest/globals';

const MockGraphQLClient = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({ GraphQLClient: MockGraphQLClient }));

const { createHasuraClient } = await import('../hasura.js');

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
  MockGraphQLClient.mockClear();
});

describe('createHasuraClient', () => {
  it('builds an admin client from the environment', () => {
    process.env.HASURA_ENDPOINT = 'http://hasura.test/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'secret';
    createHasuraClient();
    expect(MockGraphQLClient).toHaveBeenCalledWith('http://hasura.test/v1/graphql', {
      headers: { 'x-hasura-admin-secret': 'secret' },
    });
  });

  it('refuses to build a client without the admin secret', () => {
    delete process.env.HASURA_ADMIN_SECRET;
    expect(() => createHasuraClient()).toThrow('HASURA_ADMIN_SECRET is not configured');
    expect(MockGraphQLClient).not.toHaveBeenCalled();
  });
});
