import { jest } from '@jest/globals';

import { authorizeOrganizationAdminFieldChange } from './organizationAdminFieldAuthorization.js';

const grantResponse = (ownGrant, settingsAdminCount) => ({
  ownGrant,
  settingsAdmins: { aggregate: { count: settingsAdminCount } },
});

describe('authorizeOrganizationAdminFieldChange', () => {
  it('authorizes an admin session without querying', async () => {
    const client = { request: jest.fn() };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'admin',
      organizationId: 7,
    });

    expect(result).toEqual({ authorized: true });
    expect(client.request).not.toHaveBeenCalled();
  });

  it('refuses a session with no authenticated user', async () => {
    const client = { request: jest.fn() };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: undefined,
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result).toEqual({ authorized: false, reason: 'Missing authenticated session user' });
    expect(client.request).not.toHaveBeenCalled();
  });

  it('authorizes a settings admin regardless of who else administers the organization', async () => {
    const client = {
      request: jest.fn().mockResolvedValue(
        grantResponse([{ id: 1, canManageSettings: true, canManageJobs: false }], 3)
      ),
    };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result).toEqual({ authorized: true });
  });

  it('authorizes a job-only admin when the organization has no settings admin', async () => {
    const client = {
      request: jest.fn().mockResolvedValue(
        grantResponse([{ id: 1, canManageSettings: false, canManageJobs: true }], 0)
      ),
    };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result).toEqual({ authorized: true });
  });

  it('refuses a job-only admin once the organization has a settings admin', async () => {
    const client = {
      request: jest.fn().mockResolvedValue(
        grantResponse([{ id: 1, canManageSettings: false, canManageJobs: true }], 1)
      ),
    };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result).toEqual({
      authorized: false,
      reason: "Not authorized to change this organization's data",
    });
  });

  it('refuses a caller with neither capability', async () => {
    const client = {
      request: jest.fn().mockResolvedValue(
        grantResponse([{ id: 1, canManageSettings: false, canManageJobs: false }], 0)
      ),
    };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result.authorized).toBe(false);
  });

  it('refuses a caller with no grant at all for the organization', async () => {
    const client = { request: jest.fn().mockResolvedValue(grantResponse([], 0)) };

    const result = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId: 'user-1',
      sessionRole: 'user',
      organizationId: 7,
    });

    expect(result.authorized).toBe(false);
  });
});
