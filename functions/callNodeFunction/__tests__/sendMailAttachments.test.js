import { jest } from '@jest/globals';
import { createRequire } from 'node:module';

// sendMail is CommonJS and lives in a sibling function package; callNodeFunction
// is the only place in functions/ with a test runner.
const require = createRequire(import.meta.url);
const {
  isAllowedAttachmentUrl,
  safeAttachmentFilename,
  resolveAttachments,
  resolveSender,
} = require('../../sendMail/index.js');

describe('isAllowedAttachmentUrl', () => {
  it('accepts Stripe invoice documents over https', () => {
    expect(isAllowedAttachmentUrl('https://invoice.stripe.com/i/acct_1/inv_2/pdf')).toBe(true);
    expect(isAllowedAttachmentUrl('https://files.stripe.com/x.pdf')).toBe(true);
    expect(isAllowedAttachmentUrl('https://stripe.com/x.pdf')).toBe(true);
  });

  it('rejects plaintext http even on an allowed host', () => {
    expect(isAllowedAttachmentUrl('http://files.stripe.com/x.pdf')).toBe(false);
  });

  it('rejects a look-alike host that merely contains the allowed domain', () => {
    // The bug a naive `includes`/`startsWith` check would introduce.
    expect(isAllowedAttachmentUrl('https://x.stripe.com.evil.net/x.pdf')).toBe(false);
    expect(isAllowedAttachmentUrl('https://notstripe.com/x.pdf')).toBe(false);
    expect(isAllowedAttachmentUrl('https://evil.com/x.pdf')).toBe(false);
  });

  it('rejects malformed and missing URLs rather than throwing', () => {
    expect(isAllowedAttachmentUrl('not a url')).toBe(false);
    expect(isAllowedAttachmentUrl(undefined)).toBe(false);
    expect(isAllowedAttachmentUrl(null)).toBe(false);
  });

  it('does not widen the allowlist when the bucket env var is malformed', () => {
    const previous = process.env.STORAGE_BUCKET_PUBLIC_URL;
    process.env.STORAGE_BUCKET_PUBLIC_URL = 'not a url';
    try {
      expect(isAllowedAttachmentUrl('https://evil.com/x.pdf')).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.STORAGE_BUCKET_PUBLIC_URL;
      else process.env.STORAGE_BUCKET_PUBLIC_URL = previous;
    }
  });
});

describe('safeAttachmentFilename', () => {
  it('strips path traversal and separators', () => {
    expect(safeAttachmentFilename('../../etc/passwd', 'fallback')).toBe('etc_passwd');
  });

  it('keeps a normal invoice filename intact', () => {
    expect(safeAttachmentFilename('rechnung-VGD1VIPO-0001.pdf', 'fallback')).toBe(
      'rechnung-VGD1VIPO-0001.pdf'
    );
  });

  it('falls back when nothing usable remains', () => {
    expect(safeAttachmentFilename('///', 'anhang-1')).toBe('anhang-1');
    expect(safeAttachmentFilename('', 'anhang-1')).toBe('anhang-1');
    expect(safeAttachmentFilename(null, 'anhang-1')).toBe('anhang-1');
  });
});

describe('resolveAttachments', () => {
  const originalFetch = global.fetch;
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    errorSpy.mockRestore();
  });

  const pdfResponse = (bytes, declaredLength) => ({
    ok: true,
    headers: { get: () => (declaredLength === undefined ? null : String(declaredLength)) },
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  });

  it('returns an empty list for missing or empty input', async () => {
    await expect(resolveAttachments(null, 1)).resolves.toEqual([]);
    await expect(resolveAttachments([], 1)).resolves.toEqual([]);
    await expect(resolveAttachments(undefined, 1)).resolves.toEqual([]);
  });

  it('downloads an allowed descriptor into a Mailgun CustomFile', async () => {
    global.fetch = jest.fn().mockResolvedValue(pdfResponse([1, 2, 3], 3));
    const files = await resolveAttachments(
      [{ url: 'https://files.stripe.com/a.pdf', filename: 'rechnung.pdf', contentType: 'application/pdf' }],
      7
    );
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('rechnung.pdf');
    expect(files[0].contentType).toBe('application/pdf');
    expect(Buffer.isBuffer(files[0].data)).toBe(true);
    expect(files[0].data.length).toBe(3);
  });

  it('skips a disallowed host without fetching it', async () => {
    global.fetch = jest.fn();
    await expect(resolveAttachments([{ url: 'https://evil.com/a.pdf' }], 7)).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('rejects an oversize attachment declared via content-length before buffering', async () => {
    global.fetch = jest.fn().mockResolvedValue(pdfResponse([1], 9 * 1024 * 1024));
    await expect(
      resolveAttachments([{ url: 'https://files.stripe.com/big.pdf' }], 7)
    ).resolves.toEqual([]);
  });

  it('rejects an oversize body even when the server declares no length', async () => {
    const big = new Uint8Array(9 * 1024 * 1024);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => big.buffer,
    });
    await expect(
      resolveAttachments([{ url: 'https://files.stripe.com/big.pdf' }], 7)
    ).resolves.toEqual([]);
  });

  it('retries once and then gives up, returning no attachment rather than throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
    await expect(
      resolveAttachments([{ url: 'https://files.stripe.com/a.pdf' }], 7)
    ).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('succeeds on the second attempt after a transient failure', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(pdfResponse([9], 1));
    const files = await resolveAttachments([{ url: 'https://files.stripe.com/a.pdf' }], 7);
    expect(files).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('treats a non-2xx response as a failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, headers: { get: () => null } });
    await expect(
      resolveAttachments([{ url: 'https://files.stripe.com/a.pdf' }], 7)
    ).resolves.toEqual([]);
  });
});

describe('resolveSender', () => {
  const previous = {};

  beforeEach(() => {
    previous.domain = process.env.MAILGUN_DOMAIN;
    previous.additional = process.env.MAILGUN_ADDITIONAL_DOMAINS;
    // The real production value: a SUBDOMAIN of the domain every existing
    // opencampus.sh template sends as. That relationship is what makes the
    // exact-match rule below load-bearing rather than a detail.
    process.env.MAILGUN_DOMAIN = 'edu.opencampus.sh';
    process.env.MAILGUN_ADDITIONAL_DOMAINS = 'stujo.net';
  });

  afterEach(() => {
    for (const [key, name] of [['domain', 'MAILGUN_DOMAIN'], ['additional', 'MAILGUN_ADDITIONAL_DOMAINS']]) {
      if (previous[key] === undefined) delete process.env[name];
      else process.env[name] = previous[key];
    }
  });

  it('sends a StuJo mail as itself once its domain is configured', () => {
    expect(resolveSender('team@stujo.net')).toEqual({
      from: 'team@stujo.net',
      domain: 'stujo.net',
      aligned: true,
    });
  });

  it('leaves existing opencampus.sh mail exactly as it was', () => {
    // The regression this guards: MAILGUN_DOMAIN is edu.opencampus.sh, so a
    // rule that also accepted a configured SUBDOMAIN of the sender's domain
    // would start sending every EduHub mail as noreply@opencampus.sh —
    // a change to every mail the platform sends, riding on opencampus.sh
    // having relaxed DMARC alignment.
    expect(resolveSender('noreply@opencampus.sh')).toEqual({
      from: 'noreply@edu.opencampus.sh',
      domain: 'edu.opencampus.sh',
      aligned: false,
    });
  });

  it('sends as the default domain when that is the sender too', () => {
    expect(resolveSender('noreply@edu.opencampus.sh')).toEqual({
      from: 'noreply@edu.opencampus.sh',
      domain: 'edu.opencampus.sh',
      aligned: true,
    });
  });

  it('does not accept a configured subdomain of the sender', () => {
    // mg.stujo.net would align under relaxed DMARC only, so it fails safe and
    // visibly instead of sending a From this deployment cannot strictly sign.
    process.env.MAILGUN_ADDITIONAL_DOMAINS = 'mg.stujo.net';
    expect(resolveSender('team@stujo.net').aligned).toBe(false);
  });

  it('falls back for a sender no configured domain covers', () => {
    // Also the state before stujo.net is verified in Mailgun: the mail still
    // goes out, under the domain that can actually sign for it.
    process.env.MAILGUN_ADDITIONAL_DOMAINS = '';
    expect(resolveSender('team@stujo.net')).toEqual({
      from: 'noreply@edu.opencampus.sh',
      domain: 'edu.opencampus.sh',
      aligned: false,
    });
    expect(resolveSender('x@evil.example').aligned).toBe(false);
  });

  it('rejects anything that is not a single bare address', () => {
    // MailTemplate.from is admin-editable free text and lands in a mail header.
    for (const value of [
      'Team <team@stujo.net>',
      'a@stujo.net, b@stujo.net',
      'team@stujo.net\nBcc: victim@example.com',
      'team@stujo.net Bcc: victim@example.com',
      'team@localhost',
      'not-an-address',
      '',
      null,
      undefined,
    ]) {
      expect(resolveSender(value)).toEqual({
        from: 'noreply@edu.opencampus.sh',
        domain: 'edu.opencampus.sh',
        aligned: false,
      });
    }
  });

  it('ignores blank entries and casing in the configured list', () => {
    process.env.MAILGUN_ADDITIONAL_DOMAINS = ' , STUJO.NET , ';
    expect(resolveSender('team@stujo.net')).toEqual({
      from: 'team@stujo.net',
      domain: 'stujo.net',
      aligned: true,
    });
  });
});
