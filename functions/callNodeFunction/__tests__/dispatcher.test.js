import { jest } from '@jest/globals';

// The request contract of callNodeFunction (docs/SERVERLESS_FUNCTIONS.md):
// header names old and new, status codes, and event retries.
describe('callNodeFunction', () => {
  let callNodeFunction;
  let handlerMock;

  const eventRequest = (headers = { name: 'sendSpeakerAddedEmail', secret: 'test-secret' }) => ({
    headers,
    body: { event: { op: 'INSERT', data: { new: { id: 1 } } } },
  });

  const response = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  // Hasura reads only `message` and `extensions` of a non-2xx action body.
  const expectHasuraError = (body, messageKey) => {
    expect(body.message).toBe(body.error);
    expect(body.extensions).toEqual({ code: messageKey });
    expect(body.messageKey).toBe(messageKey);
  };

  const call = async (request) => {
    const res = response();
    await callNodeFunction(request, res);
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };

  beforeAll(async () => {
    handlerMock = jest.fn();
    jest.unstable_mockModule('../sendSpeakerAddedEmail/index.js', () => ({ default: handlerMock }));

    ({ callNodeFunction } = await import('../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    handlerMock.mockReset();
    handlerMock.mockResolvedValue({ success: true });
  });

  describe('header names', () => {
    it.each([
      ['legacy name + secret', { name: 'sendSpeakerAddedEmail', secret: 'test-secret' }],
      ['Function-Name + Hasura-Secret', { 'function-name': 'sendSpeakerAddedEmail', 'hasura-secret': 'test-secret' }],
      ['Function-Name + legacy secret', { 'function-name': 'sendSpeakerAddedEmail', secret: 'test-secret' }],
      ['legacy name + Hasura-Secret', { name: 'sendSpeakerAddedEmail', 'hasura-secret': 'test-secret' }],
      ['both names, same value', { name: 'sendSpeakerAddedEmail', 'function-name': 'sendSpeakerAddedEmail', secret: 'test-secret' }],
    ])('routes with %s', async (_label, headers) => {
      const { status, body } = await call(eventRequest(headers));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(handlerMock).toHaveBeenCalledTimes(1);
    });

    it('answers 400 when Function-Name and name disagree', async () => {
      const { status, body } = await call(
        eventRequest({ name: 'sendSpeakerAddedEmail', 'function-name': 'getSignedUrl', secret: 'test-secret' })
      );

      expect(status).toBe(400);
      expectHasuraError(body, 'CONFLICTING_FUNCTION_NAME');
      expect(handlerMock).not.toHaveBeenCalled();
    });
  });

  describe('status codes', () => {
    it.each([
      ['no secret header', { name: 'sendSpeakerAddedEmail' }, 'MISSING_SECRET'],
      ['a wrong legacy secret', { name: 'sendSpeakerAddedEmail', secret: 'wrong' }, 'INVALID_SECRET'],
      ['a wrong Hasura-Secret', { name: 'sendSpeakerAddedEmail', 'hasura-secret': 'wrong' }, 'INVALID_SECRET'],
    ])('answers 401 for %s', async (_label, headers, messageKey) => {
      const { status, body } = await call(eventRequest(headers));

      expect(status).toBe(401);
      expectHasuraError(body, messageKey);
      expect(handlerMock).not.toHaveBeenCalled();
    });

    it('answers 500 when the server secret is not configured', async () => {
      delete process.env.HASURA_CLOUD_FUNCTION_SECRET;
      const { status, body } = await call(eventRequest());

      expect(status).toBe(500);
      expectHasuraError(body, 'SERVER_MISCONFIGURED');
    });

    it.each([
      ['an unknown name', { 'function-name': 'noSuchFunction', 'hasura-secret': 'test-secret' }],
      ['a prototype key', { name: 'constructor', secret: 'test-secret' }],
      ['no name header', { secret: 'test-secret' }],
    ])('answers 404 for %s', async (_label, headers) => {
      const { status, body } = await call(eventRequest(headers));

      expect(status).toBe(404);
      expectHasuraError(body, 'FUNCTION_NOT_FOUND');
    });

    it('answers 200 with success false for a thrown error', async () => {
      handlerMock.mockRejectedValue(Object.assign(new Error('boom'), { messageKey: 'BOOM' }));
      const { status, body } = await call(eventRequest());

      expect(status).toBe(200);
      expect(body).toEqual({ success: false, error: 'boom', messageKey: 'BOOM' });
    });
  });

  describe('pinned actions', () => {
    let dispatch;
    const pinnedHandler = jest.fn();
    const otherHandler = jest.fn();

    beforeAll(async () => {
      const { createDispatcher } = await import('../lib/dispatcher.js');
      dispatch = createDispatcher({
        name: 'test',
        handlers: { syncMe: pinnedHandler, other: otherHandler },
        pinnedActions: { syncMeAction: 'syncMe' },
      });
    });

    beforeEach(() => {
      pinnedHandler.mockReset().mockResolvedValue({ result: 'synced' });
      otherHandler.mockReset().mockResolvedValue({ success: true });
    });

    const callPinned = async (headers, actionName = 'syncMeAction') => {
      const res = response();
      await dispatch({ headers, body: { action: { name: actionName }, input: {}, request_query: 'mutation { a }' } }, res);
      return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
    };

    it('runs the pinned handler for its action', async () => {
      const { status, body } = await callPinned({ 'function-name': 'syncMe', 'hasura-secret': 'test-secret' });

      expect(status).toBe(200);
      expect(body).toEqual({ result: 'synced' });
    });

    it('runs the pinned handler without a routing header', async () => {
      const { status } = await callPinned({ 'hasura-secret': 'test-secret' });

      expect(status).toBe(200);
      expect(pinnedHandler).toHaveBeenCalledTimes(1);
    });

    // A forwarded client header naming another handler must not reroute the
    // action (Hasura still attaches the real secret).
    it.each([
      ['Function-Name', { 'function-name': 'other', 'hasura-secret': 'test-secret' }],
      ['legacy name', { name: 'other', 'hasura-secret': 'test-secret' }],
    ])('answers 400 when %s names another handler', async (_label, headers) => {
      const { status, body } = await callPinned(headers);

      expect(status).toBe(400);
      expect(body.messageKey).toBe('CONFLICTING_FUNCTION_NAME');
      expect(otherHandler).not.toHaveBeenCalled();
      expect(pinnedHandler).not.toHaveBeenCalled();
    });

    it('still requires the secret', async () => {
      const { status } = await callPinned({ 'function-name': 'syncMe' });

      expect(status).toBe(401);
    });

    it('routes other actions by header', async () => {
      const { status } = await callPinned({ 'function-name': 'other', 'hasura-secret': 'test-secret' }, 'otherAction');

      expect(status).toBe(200);
      expect(otherHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('httpStatus', () => {
    it('answers with the status a handler sets and drops the field', async () => {
      handlerMock.mockResolvedValue({ httpStatus: 403, message: 'Account deleted', error: 'Account deleted' });
      const { status, body } = await call({ ...eventRequest(), body: { input: {}, request_query: 'mutation { a }' } });

      expect(status).toBe(403);
      expect(body).toEqual({ message: 'Account deleted', error: 'Account deleted' });
    });

    it('adds message and extensions to a non-2xx handler body', async () => {
      handlerMock.mockResolvedValue({ httpStatus: 500, success: false, error: 'No grant', messageKey: 'GRANT_FAILED' });
      const { status, body } = await call(eventRequest());

      expect(status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'No grant',
        messageKey: 'GRANT_FAILED',
        message: 'No grant',
        extensions: { code: 'GRANT_FAILED' },
      });
    });

    it('leaves a 2xx handler body as is', async () => {
      handlerMock.mockResolvedValue({ httpStatus: 202, success: true, messageKey: 'QUEUED' });
      const { status, body } = await call(eventRequest());

      expect(status).toBe(202);
      expect(body).toEqual({ success: true, messageKey: 'QUEUED' });
    });

    it('takes a non-2xx httpStatus over retryable', async () => {
      handlerMock.mockResolvedValue({ httpStatus: 400, retryable: true });
      const { status } = await call(eventRequest());

      expect(status).toBe(400);
    });

    // A 2xx would tell Hasura the event succeeded and stop its retries.
    it('takes retryable over a 2xx httpStatus in an event trigger', async () => {
      handlerMock.mockResolvedValue({
        httpStatus: 200, success: false, retryable: true, error: 'Queue down', messageKey: 'EMAIL_QUEUE_FAILED',
      });
      const { status, body } = await call(eventRequest());

      expect(status).toBe(503);
      expect(body).not.toHaveProperty('httpStatus');
      expectHasuraError(body, 'EMAIL_QUEUE_FAILED');
    });

    it('keeps a 2xx httpStatus with retryable outside a trigger', async () => {
      handlerMock.mockResolvedValue({ httpStatus: 202, success: true, retryable: true });
      const { status } = await call({ ...eventRequest(), body: { input: {} } });

      expect(status).toBe(202);
    });

    it('ignores a httpStatus that is not an integer', async () => {
      handlerMock.mockResolvedValue({ success: true, httpStatus: '500' });
      const { status } = await call(eventRequest());

      expect(status).toBe(200);
    });
  });

  describe('response body', () => {
    it('wraps a result without success/error for a query', async () => {
      handlerMock.mockResolvedValue({ link: 'x' });
      const { body } = await call({ ...eventRequest(), body: { input: {}, request_query: 'query { a }' } });

      expect(body).toEqual({ success: true, data: { link: 'x' } });
    });

    it('returns a mutation result as is', async () => {
      handlerMock.mockResolvedValue({ link: 'x' });
      const { body } = await call({ ...eventRequest(), body: { input: {}, request_query: 'mutation { a }' } });

      expect(body).toEqual({ link: 'x' });
    });
  });

  // Event and cron triggers retry only on a non-2xx answer, so the
  // dispatcher answers 503 just for failures a handler marks retryable.
  describe('retries', () => {
    it('answers 503 for a retryable event failure', async () => {
      handlerMock.mockResolvedValue({
        success: false, retryable: true, error: 'Queue down', messageKey: 'EMAIL_QUEUE_FAILED',
      });
      const { status, body } = await call(eventRequest());

      expect(status).toBe(503);
      expect(body.retryable).toBe(true);
      expectHasuraError(body, 'EMAIL_QUEUE_FAILED');
    });

    it('answers 503 for a retryable cron failure', async () => {
      handlerMock.mockResolvedValue({ success: false, retryable: true, messageKey: 'EMAIL_QUEUE_FAILED' });
      const { status } = await call({
        ...eventRequest(),
        body: { scheduled_time: '2026-11-04T10:00:00Z', payload: {} },
      });

      expect(status).toBe(503);
    });

    it('answers 200 for a failure that is not retryable', async () => {
      handlerMock.mockResolvedValue({ success: false, messageKey: 'SPEAKER_NO_EMAIL' });
      const { status } = await call(eventRequest());

      expect(status).toBe(200);
    });

    it('answers 200 for a retryable failure outside an event trigger', async () => {
      handlerMock.mockResolvedValue({ success: false, retryable: true, messageKey: 'EMAIL_QUEUE_FAILED' });
      const { status } = await call({ ...eventRequest(), body: { input: {} } });

      expect(status).toBe(200);
    });
  });
});
