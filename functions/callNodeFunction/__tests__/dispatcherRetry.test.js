import { jest } from '@jest/globals';

// The dispatcher answers event triggers with a non-2xx status only for
// failures a handler marks as retryable, so Hasura retries just those.
describe('callNodeFunction event retries', () => {
  let callNodeFunction;
  let handlerMock;

  const eventRequest = () => ({
    headers: { name: 'sendSpeakerAddedEmail', secret: 'test-secret' },
    body: { event: { op: 'INSERT', data: { new: { id: 1 } } } },
  });

  const response = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  beforeAll(async () => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    handlerMock = jest.fn();
    jest.unstable_mockModule('../sendSpeakerAddedEmail/index.js', () => ({ default: handlerMock }));

    // Keep the logger from writing error.log/combined.log into the package.
    const winston = (await import('winston')).default;
    jest.unstable_mockModule('winston', () => ({
      default: {
        ...winston,
        transports: { Console: winston.transports.Console, File: winston.transports.Console },
      },
    }));

    ({ callNodeFunction } = await import('../index.js'));
  });

  it('answers 500 for a retryable event failure', async () => {
    handlerMock.mockResolvedValue({ success: false, retryable: true, messageKey: 'EMAIL_QUEUE_FAILED' });
    const res = response();

    await callNodeFunction(eventRequest(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('answers 200 for a failure that is not retryable', async () => {
    handlerMock.mockResolvedValue({ success: false, messageKey: 'SPEAKER_NO_EMAIL' });
    const res = response();

    await callNodeFunction(eventRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('answers 200 for a retryable failure outside an event trigger', async () => {
    handlerMock.mockResolvedValue({ success: false, retryable: true, messageKey: 'EMAIL_QUEUE_FAILED' });
    const res = response();

    await callNodeFunction({ ...eventRequest(), body: { input: {} } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
