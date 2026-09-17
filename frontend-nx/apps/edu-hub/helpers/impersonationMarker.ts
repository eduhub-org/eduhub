/**
 * The name of the readable impersonation marker cookie, kept apart from
 * helpers/impersonation.ts so the browser bundle does not pull in that module's
 * server-only dependencies (node:crypto, graphql-request, next-auth/jwt).
 */
export const IMPERSONATION_MARKER_COOKIE = 'eduhub_impersonating';
