import { beforeEach, expect, it, jest } from '@jest/globals';

const request = jest.fn();
const deleteFile = jest.fn();
const listFiles = jest.fn();
const deleteIdentity = jest.fn();
const getKeycloakToken = jest.fn();
const unsubscribe = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({ request, gql: (parts) => parts[0] }));
jest.unstable_mockModule('@google-cloud/storage', () => ({ Storage: jest.fn() }));
jest.unstable_mockModule('../lib/cloud-storage.js', () => ({
  buildCloudStorage: () => ({ deleteFile, listFiles }),
}));
jest.unstable_mockModule('../lib/utils.js', () => ({ getKeycloakToken }));
jest.unstable_mockModule('axios', () => ({ default: { delete: deleteIdentity } }));
jest.unstable_mockModule('../syncGhostNewsletterSubscription/index.js', () => ({
  unsubscribeForAccountDeletion: unsubscribe,
}));
const { default: anonymizeUser, deleteMyAccount } = await import('../anonymizeUser/index.js');
const { eraseRawAttendance } = await import('../anonymizeUser/personalData.js');
const USER = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const OTHER = '7c9e6679-7425-40de-944b-e07fc1f90ae8';
const logger = { error: jest.fn() };
const req = (role = 'user', input = { userId: OTHER }) => ({
  headers: { bucket: 'test' },
  body: { input, session_variables: { 'x-hasura-role': role, 'x-hasura-user-id': USER } },
});
const user = () => ({
  id: USER, firstName: 'Test', lastName: 'Person', email: 'test_%@example.com',
  picture: 'users/test/public/photo.png', matrixUserHandle: 'test.person',
  CourseEnrollments: [{ id: 8, achievementCertificateURL: 'achievement.pdf', attendanceCertificateURL: 'attendance.pdf' }],
  OrganizationNewsletterSubscriptions: [{ status: 'SUBSCRIBED' }],
});
beforeEach(() => {
  jest.clearAllMocks();
  request.mockImplementation(async (_endpoint, document) => {
    if (document.includes('query AccountDeletionData')) return {
      User_by_pk: user(), CourseInstructor: [{ id: 9, certificateURL: 'instructor.pdf' }],
      SessionSpeaker: [], Attendance: [], Session: [],
    };
    return { update_User_by_pk: { id: USER } };
  });
  deleteFile.mockReset().mockResolvedValue(undefined);
  listFiles.mockReset().mockResolvedValue([{ name: 'users/test/public/photo-64.webp' }]);
  deleteIdentity.mockReset().mockResolvedValue({});
  getKeycloakToken.mockResolvedValue('token');
  unsubscribe.mockReset().mockResolvedValue(undefined);
});

it('always deletes the verified caller, ignoring an arbitrary input user ID', async () => {
  const result = await deleteMyAccount(req(), logger);
  expect(result).toMatchObject({ anonymizedUserId: USER, error: null, messageKey: 'ANONYMIZATION_SUCCESS' });
  expect(request.mock.calls[0][2]).toEqual({ userId: USER });
  expect(request.mock.calls[1][2].userId).toBe(USER);
  expect(deleteIdentity.mock.calls[0][0]).toContain(`/users/${USER}`);
});

it.each(['anonymous', undefined, 'user_access'])('rejects self-deletion for untrusted role %s before any side effect', async (role) => {
  const call = req();
  call.body.session_variables['x-hasura-role'] = role;
  expect(await deleteMyAccount(call, logger)).toMatchObject({ error: 'UNAUTHORIZED' });
  expect(request).not.toHaveBeenCalled();
  expect(deleteFile).not.toHaveBeenCalled();
});

it('rejects a missing session identity', async () => {
  const call = req();
  delete call.body.session_variables;
  expect(await deleteMyAccount(call, logger)).toMatchObject({ error: 'UNAUTHORIZED' });
  expect(request).not.toHaveBeenCalled();
});

it.each(['user', 'instructor', 'org_admin'])('keeps arbitrary-target deletion admin-only for %s', async (role) => {
  expect(await anonymizeUser(req(role), logger)).toMatchObject({ error: 'UNAUTHORIZED' });
  expect(request).not.toHaveBeenCalled();
});

it('allows admins to delete an explicitly selected account', async () => {
  await anonymizeUser(req('admin'), logger);
  expect(request.mock.calls[0][2]).toEqual({ userId: OTHER });
});

it('deletes every certificate type, the profile image and resized versions', async () => {
  await deleteMyAccount(req(), logger);
  for (const file of ['achievement.pdf', 'attendance.pdf', 'instructor.pdf', 'users/test/public/photo.png', 'users/test/public/photo-64.webp']) {
    expect(deleteFile).toHaveBeenCalledWith(file, 'test');
  }
  const variables = request.mock.calls[1][2];
  expect(variables.mailFilter._or[0].to._ilike).toBe('%test\\_\\%@example.com%');
  expect(unsubscribe.mock.invocationCallOrder[0]).toBeLessThan(request.mock.invocationCallOrder[1]);
  expect(request.mock.invocationCallOrder[1]).toBeLessThan(deleteIdentity.mock.invocationCallOrder[0]);
});

it('preserves database data, identity and paths for retry when storage cleanup fails', async () => {
  deleteFile.mockRejectedValue(new Error('storage unavailable'));
  expect(await deleteMyAccount(req(), logger)).toMatchObject({ error: 'ERROR_SOME_STEPS_FAILED' });
  expect(request).toHaveBeenCalledTimes(1);
  expect(deleteIdentity).not.toHaveBeenCalled();
});

it('does not erase the email needed for retry when newsletter removal fails', async () => {
  unsubscribe.mockRejectedValue(new Error('newsletter unavailable'));
  expect(await deleteMyAccount(req(), logger)).toMatchObject({ error: 'ERROR_SOME_STEPS_FAILED' });
  expect(request).toHaveBeenCalledTimes(1);
  expect(deleteIdentity).not.toHaveBeenCalled();
});

it('can retry files and identities already removed', async () => {
  deleteFile.mockRejectedValue({ code: 'ENOENT' });
  deleteIdentity.mockRejectedValue({ response: { status: 404 } });
  expect(await deleteMyAccount(req(), logger)).toMatchObject({ error: null, messageKey: 'ANONYMIZATION_SUCCESS' });
});

it('reports incomplete deletion when Keycloak fails after database cleanup', async () => {
  deleteIdentity.mockRejectedValue(new Error('Keycloak unavailable'));
  expect(await deleteMyAccount(req(), logger)).toMatchObject({
    error: 'ERROR_SOME_STEPS_FAILED', steps: { user_data_anonymization: true, keycloak_deletion: false },
  });
});

it('removes matching raw attendance rows without changing other participants or nulling the session', () => {
  const raw = { email: { 0: 'test@example.com', 1: 'other@example.com' }, name: { 0: 'Test Person', 1: 'Other Person' }, time: { 0: 100, 1: 200 } };
  const result = JSON.parse(eraseRawAttendance(JSON.stringify(raw), new Set(['test@example.com'])));
  expect(result).toEqual({ email: { 1: 'other@example.com' }, name: { 1: 'Other Person' }, time: { 1: 200 } });
});

it('keeps the identity active when the database transaction fails', async () => {
  const successfulRequest = request.getMockImplementation();
  request.mockImplementation(async (...args) => {
    if (args[1].includes('mutation EraseAccountPersonalData')) throw new Error('database unavailable');
    return successfulRequest(...args);
  });
  expect(await deleteMyAccount(req(), logger)).toMatchObject({
    error: 'ERROR_SOME_STEPS_FAILED', steps: { user_data_anonymization: false, keycloak_deletion: false },
  });
  expect(deleteIdentity).not.toHaveBeenCalled();
});
