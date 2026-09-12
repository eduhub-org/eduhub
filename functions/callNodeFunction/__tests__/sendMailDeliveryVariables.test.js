import { jest } from '@jest/globals';
import { createRequire } from 'node:module';

// sendMail is CommonJS and lives in a sibling function package; callNodeFunction
// is the only place in functions/ with a test runner.
const require = createRequire(import.meta.url);
const { sendMail } = require('../../sendMail/index.js');

const SECRET = 'test-cloud-function-secret';

function makeRequest(newRow) {
  return {
    headers: { secret: SECRET },
    body: { event: { data: { new: newRow } } },
  };
}

function makeResponse() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

const baseRow = {
  id: 4711,
  subject: 'Neue Stellenanzeige',
  content: '<p>Hallo</p>',
  to: 'employer@example.org',
  from: 'team@stujo.net',
};

describe('sendMail delivery-status variables', () => {
  let logSpy;
  const saved = {};
  const ENV = {
    // The development branch logs the assembled message instead of sending it,
    // which is the only way to observe the outgoing Mailgun payload without
    // mocking the client.
    ENVIRONMENT: 'development',
    HASURA_CLOUD_FUNCTION_SECRET: SECRET,
    // Set so team@stujo.net resolves as an aligned sender; otherwise every
    // case here also trips the sender-fallback warning.
    MAILGUN_DOMAIN: 'edu.opencampus.sh',
    MAILGUN_ADDITIONAL_DOMAINS: 'stujo.net',
  };

  beforeEach(() => {
    for (const [key, value] of Object.entries(ENV)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    for (const key of Object.keys(ENV)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  function loggedMail() {
    const call = logSpy.mock.calls.find(([label]) => label === 'Development email:');
    expect(call).toBeDefined();
    return call[1];
  }

  it('carries the MailLog id as a Mailgun custom variable', async () => {
    const res = makeResponse();
    await sendMail(makeRequest(baseRow), res);

    expect(res.body).toEqual({ success: true });
    // A string, because Mailgun echoes v: variables back as strings and the
    // sync cron parses them straight into MailLog.id.
    expect(loggedMail().maillogId).toBe('4711');
  });

  it('omits the variable when the row carries no usable id', async () => {
    // Without an id there is nothing to join an event back onto, and a literal
    // 'undefined' in the variable would produce events that look keyed but
    // match no row.
    for (const id of [undefined, null, 'not-a-number', 12.5]) {
      logSpy.mockClear();
      const res = makeResponse();
      await sendMail(makeRequest({ ...baseRow, id }), res);

      expect(res.body).toEqual({ success: true });
      expect(loggedMail().maillogId).toBeUndefined();
    }
  });

  it('rejects an unauthorized request before assembling a message', async () => {
    const res = makeResponse();
    await sendMail({ headers: { secret: 'wrong' }, body: { event: { data: { new: baseRow } } } }, res);

    expect(res.statusCode).toBe(401);
    expect(logSpy.mock.calls.some(([label]) => label === 'Development email:')).toBe(false);
  });
});
