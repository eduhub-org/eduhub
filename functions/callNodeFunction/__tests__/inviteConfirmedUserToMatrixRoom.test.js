import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({ request })),
}));

process.env.HASURA_ENDPOINT = 'http://hasura.test/v1/graphql';
process.env.HASURA_ADMIN_SECRET = 'test-secret';
process.env.MATRIX_HOMESERVER_URL = 'https://matrix.test';
process.env.MATRIX_ADMIN_ACCESS_TOKEN = 'bot-token';
process.env.MATRIX_SERVER_NAME = 'opencampus.sh';

const { default: inviteConfirmedUserToMatrixRoom } = await import('../inviteConfirmedUserToMatrixRoom/index.js');

const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ROOM_ID = '!abc:opencampus.sh';
const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const enrollment = (overrides = {}) => ({ courseId: 42, userId: USER_ID, status: 'CONFIRMED', isTest: false, ...overrides });

const call = (op, next, old = null) =>
  inviteConfirmedUserToMatrixRoom({ body: { event: { op, data: { new: next, old } } } }, logger);

const answer = ({ roomId = ROOM_ID, handle = 'ada.lovelace.7c9e66' } = {}) => {
  request.mockResolvedValue({
    Course_by_pk: { id: 42, matrixRoomId: roomId },
    User_by_pk: { id: USER_ID, matrixUserHandle: handle },
  });
};

const matrixOk = () => new Response(JSON.stringify({}), { status: 200 });
const fetchMock = jest.fn();

const inviteCalls = () => fetchMock.mock.calls.filter(([url]) => url.endsWith('/invite'));

beforeEach(() => {
  request.mockReset();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => matrixOk());
  global.fetch = fetchMock;
});

afterEach(() => {
  delete global.fetch;
});

describe('inviteConfirmedUserToMatrixRoom', () => {
  it('invites a participant whose status changes to CONFIRMED', async () => {
    answer();
    const result = await call('UPDATE', enrollment(), enrollment({ status: 'INVITED' }));

    expect(result).toMatchObject({ success: true, messageKey: 'MATRIX_PARTICIPANT_INVITED' });
    expect(inviteCalls()).toHaveLength(1);
    const [url, init] = inviteCalls()[0];
    expect(url).toBe(`https://matrix.test/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/invite`);
    expect(JSON.parse(init.body)).toEqual({ user_id: '@ada.lovelace.7c9e66:opencampus.sh' });
  });

  it('invites on an insert that is already CONFIRMED', async () => {
    answer();
    const result = await call('INSERT', enrollment());
    expect(result.messageKey).toBe('MATRIX_PARTICIPANT_INVITED');
    expect(inviteCalls()).toHaveLength(1);
  });

  it.each([
    ['a status other than CONFIRMED', 'UPDATE', enrollment({ status: 'INVITED' }), enrollment({ status: 'APPLIED' })],
    ['an update that was already CONFIRMED', 'UPDATE', enrollment(), enrollment()],
    ['a preview enrollment', 'INSERT', enrollment({ isTest: true }), null],
  ])('does nothing for %s', async (_label, op, next, old) => {
    const result = await call(op, next, old);
    expect(result).toMatchObject({ success: true, messageKey: 'MATRIX_NO_ACTION_NEEDED' });
    expect(request).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a course without a Matrix room', async () => {
    answer({ roomId: null });
    const result = await call('INSERT', enrollment());
    expect(result.messageKey).toBe('MATRIX_ROOM_NOT_FOUND');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a user without a Matrix handle', async () => {
    answer({ handle: null });
    const result = await call('INSERT', enrollment());
    expect(result.messageKey).toBe('MATRIX_USER_HANDLE_MISSING');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats an existing membership as done', async () => {
    answer();
    fetchMock.mockImplementation(async (url) =>
      url.endsWith('/invite')
        ? new Response(JSON.stringify({ errcode: 'M_FORBIDDEN', error: 'user is already in the room.' }), { status: 403 })
        : matrixOk()
    );
    const result = await call('INSERT', enrollment());
    expect(result).toMatchObject({ success: true, messageKey: 'MATRIX_PARTICIPANT_ALREADY_IN_ROOM' });
  });

  it('reports a failed invite', async () => {
    answer();
    fetchMock.mockImplementation(async (url) =>
      url.endsWith('/invite')
        ? new Response(JSON.stringify({ errcode: 'M_FORBIDDEN', error: 'You do not have permission' }), { status: 403 })
        : matrixOk()
    );
    const result = await call('INSERT', enrollment());
    expect(result).toMatchObject({ success: false, messageKey: 'MATRIX_PARTICIPANT_INVITE_FAILED' });
  });
});
