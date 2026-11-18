import { afterEach, describe, expect, it } from '@jest/globals';
import {
  envOr,
  frontendUrl,
  hasuraConfig,
  keycloakConfig,
  matrixConfig,
  requireEnv,
  trimmedEnv,
} from '../config.js';

const NAME = 'CONFIG_TEST_VALUE';
const saved = { ...process.env };

afterEach(() => {
  process.env = { ...saved };
});

describe('requireEnv', () => {
  it('returns the value as set', () => {
    process.env[NAME] = 'abc';
    expect(requireEnv(NAME)).toBe('abc');
  });

  it.each([undefined, '', '   '])('throws for %p', (value) => {
    if (value === undefined) delete process.env[NAME];
    else process.env[NAME] = value;
    expect(() => requireEnv(NAME)).toThrow(`${NAME} is not configured`);
  });

  it('reads the environment at call time', () => {
    delete process.env[NAME];
    expect(() => requireEnv(NAME)).toThrow();
    process.env[NAME] = 'late';
    expect(requireEnv(NAME)).toBe('late');
  });
});

describe('optional getters', () => {
  it('envOr falls back on unset and empty values', () => {
    delete process.env[NAME];
    expect(envOr(NAME, 'x')).toBe('x');
    process.env[NAME] = '';
    expect(envOr(NAME, 'x')).toBe('x');
    process.env[NAME] = 'y';
    expect(envOr(NAME, 'x')).toBe('y');
  });

  it('trimmedEnv returns null for blank values', () => {
    process.env[NAME] = '  ';
    expect(trimmedEnv(NAME)).toBeNull();
    process.env[NAME] = ' v ';
    expect(trimmedEnv(NAME)).toBe('v');
  });

  it('frontendUrl defaults to production', () => {
    delete process.env.FRONTEND_URL;
    expect(frontendUrl()).toBe('https://edu.opencampus.sh');
  });

  it('keycloakConfig defaults the admin user', () => {
    delete process.env.KEYCLOAK_USER;
    process.env.KEYCLOAK_URL = 'http://kc';
    expect(keycloakConfig()).toEqual({
      url: 'http://kc',
      username: 'keycloak',
      password: process.env.KEYCLOAK_PW,
    });
  });

  it('matrixConfig trims each value', () => {
    process.env.MATRIX_HOMESERVER_URL = ' https://m ';
    delete process.env.MATRIX_SERVER_NAME;
    expect(matrixConfig()).toMatchObject({
      homeserverUrl: 'https://m',
      serverName: null,
    });
  });
});

describe('hasuraConfig', () => {
  it('requires endpoint and admin secret', () => {
    process.env.HASURA_ENDPOINT = 'http://h/v1/graphql';
    delete process.env.HASURA_ADMIN_SECRET;
    expect(() => hasuraConfig()).toThrow('HASURA_ADMIN_SECRET is not configured');
    process.env.HASURA_ADMIN_SECRET = 's';
    expect(hasuraConfig()).toEqual({ endpoint: 'http://h/v1/graphql', adminSecret: 's' });
  });
});
