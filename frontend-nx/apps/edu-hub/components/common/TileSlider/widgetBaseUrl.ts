/**
 * Resolve the EduHub base URL for links rendered inside an embeddable widget.
 *
 * Widget tiles are served from the EduHub domain (even when the widget is
 * embedded in an iframe on a third-party site), so links must point at absolute
 * EduHub URLs rather than the host page. Priority:
 *   1. `NEXT_PUBLIC_BASE_URL` when explicitly configured.
 *   2. `window.location.origin` (correct in dev/staging/prod on the client).
 *   3. `NEXTAUTH_URL` / production fallback during SSR.
 */
export const getWidgetBaseUrl = (): string => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXTAUTH_URL || 'https://edu.opencampus.sh';
};
