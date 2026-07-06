import { useEffect, useState } from 'react';

export interface WidgetApiKeyState {
  /** Resolved organization id when the API key is valid, otherwise null. */
  organizationId: number | null;
  /** True while the API key is being validated server-side. */
  validating: boolean;
  /** Human-readable validation error, or null when there is none. */
  error: string | null;
}

/**
 * Validates an optional widget API key (server-side, via
 * `/api/widget/validate-api-key`) and resolves it to an organization id so a
 * widget can scope its content to that organization.
 *
 * @param apiKey  Raw `apiKey` query param (may be absent or an array).
 * @param ready   Gate the request until the router/query params are ready.
 */
export const useWidgetApiKey = (
  apiKey: string | string[] | undefined,
  ready: boolean
): WidgetApiKeyState => {
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !apiKey || typeof apiKey !== 'string') {
      return undefined;
    }

    let cancelled = false;

    const validateApiKey = async () => {
      setValidating(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch('/api/widget/validate-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (cancelled) return;

        if (data.valid && data.organizationId) {
          setOrganizationId(data.organizationId);
        } else {
          setError(data.error || 'Invalid API key');
        }
      } catch (err) {
        if (cancelled) return;
        if (process.env.NODE_ENV !== 'production') {
          console.error(err);
        }
        setError('Failed to validate API key');
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setValidating(false);
        }
      }
    };

    validateApiKey();

    return () => {
      cancelled = true;
    };
  }, [apiKey, ready]);

  return { organizationId, validating, error };
};
