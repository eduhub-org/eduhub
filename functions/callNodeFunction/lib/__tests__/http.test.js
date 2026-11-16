import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { HttpError, http, isNetworkError } from '../http.js';

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

const respond = (status, text) => {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    headers: new Headers(),
    text: async () => text,
  });
};

describe('http', () => {
  it('parses JSON bodies', async () => {
    respond(200, '{"a":1}');
    await expect(http.get('https://x.test')).resolves.toMatchObject({ status: 200, data: { a: 1 } });
  });

  it('keeps non-JSON bodies as text', async () => {
    respond(200, 'plain');
    await expect(http.get('https://x.test')).resolves.toMatchObject({ data: 'plain' });
  });

  it('sends objects as JSON and forms as URLSearchParams', async () => {
    respond(204, '');
    await http.post('https://x.test', [{ id: 1 }], { headers: { Authorization: 'Bearer t' } });
    let [, init] = global.fetch.mock.calls[0];
    expect(init).toMatchObject({
      method: 'POST',
      body: '[{"id":1}]',
      headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
    });

    respond(200, '{}');
    const form = new URLSearchParams({ a: 'b' });
    await http.post('https://x.test', form);
    [, init] = global.fetch.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('sends a DELETE body from options.data', async () => {
    respond(204, '');
    await http.delete('https://x.test', { data: [1] });
    expect(global.fetch.mock.calls[0][1]).toMatchObject({ method: 'DELETE', body: '[1]' });
  });

  it('rejects outside 2xx like axios', async () => {
    respond(404, '{"error":"User not found"}');
    const error = await http.get('https://x.test').catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe('Request failed with status code 404');
    expect(error.response).toEqual({ status: 404, data: { error: 'User not found' } });
  });

  it('lets validateStatus accept any status', async () => {
    respond(500, '{"message":"down"}');
    await expect(
      http.post('https://x.test', {}, { validateStatus: () => true })
    ).resolves.toMatchObject({ status: 500, data: { message: 'down' } });
  });
});

describe('isNetworkError', () => {
  it('is true only for failures without a response', () => {
    expect(isNetworkError(new TypeError('fetch failed'))).toBe(true);
    expect(isNetworkError(Object.assign(new Error('t'), { name: 'TimeoutError' }))).toBe(true);
    expect(isNetworkError(new HttpError(502, null))).toBe(false);
    expect(isNetworkError(new Error('other'))).toBe(false);
  });
});
