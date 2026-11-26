/**
 * The API key for the LLM provider. On Vertex AI it is the service account's OAuth access token,
 * which lasts about an hour: it is fetched from the Cloud Run metadata server, cached, and fetched
 * again five minutes before it expires or after the provider answers 401.
 */

const METADATA_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
const METADATA_TIMEOUT_MS = 5_000;
const REFRESH_MARGIN_MS = 5 * 60_000;

export interface ApiKeySource {
  get(): Promise<string>;
  /** Forget a cached token, e.g. after a 401. */
  invalidate(): void;
}

export const staticApiKey = (key: string): ApiKeySource => ({
  get: async () => key,
  invalidate: () => undefined,
});

export const metadataServerToken = (
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now
): ApiKeySource => {
  let cached: { token: string; expiresAt: number } | null = null;
  let pending: Promise<string> | null = null;

  const fetchToken = async () => {
    const response = await fetchImpl(METADATA_TOKEN_URL, {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`metadata server answered ${response.status}`);
    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error('metadata server returned no access token');
    cached = { token: body.access_token, expiresAt: now() + (body.expires_in ?? 3600) * 1000 };
    return body.access_token;
  };

  return {
    get: async () => {
      if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now()) return cached.token;
      // One refresh for all concurrent requests.
      pending ??= fetchToken().finally(() => {
        pending = null;
      });
      return pending;
    },
    invalidate: () => {
      cached = null;
    },
  };
};
