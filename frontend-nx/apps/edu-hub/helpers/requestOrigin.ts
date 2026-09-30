import type { IncomingMessage } from 'http';

/** Origin of the current request, so staging and preview hosts stay self-consistent. */
export const requestOrigin = (req: IncomingMessage): string => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0] ?? 'https';
  const host = req.headers.host ?? 'edu.opencampus.sh';
  return `${proto}://${host}`;
};
