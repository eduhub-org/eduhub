import crypto from 'crypto';
import { OperationError } from './errors';
import type { CourseFields, CourseSnapshot, SessionChanges } from './types';

/**
 * Proposed Changes are stateless: the server signs what it proposed and the client hands the token
 * back to apply it. Nothing is stored between propose and apply (no table, no audit trail).
 * The token binds the change to the proposing user and role, and records a fingerprint of the
 * part of the course it touches, so apply can refuse a proposal made against an older state.
 */

export type ProposalKind = 'course_texts' | 'course_settings' | 'sessions';

export interface ProposalPayload {
  v: 1;
  kind: ProposalKind;
  courseId: number;
  userId: string;
  role: string;
  /** Fingerprint of the touched part of the course when the change was proposed. */
  fingerprint: string;
  changes: Partial<CourseFields> | SessionChanges;
  /** Expiry, seconds since the epoch. */
  exp: number;
}

export const PROPOSAL_TTL_SECONDS = 24 * 60 * 60;

const hmac = (secret: string, data: string) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

export const signProposal = (payload: ProposalPayload, secret: string): string => {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `v1.${body}.${hmac(secret, body)}`;
};

export const verifyProposal = (token: string, secret: string, now = Date.now()): ProposalPayload => {
  const [version, body, signature] = typeof token === 'string' ? token.split('.') : [];
  if (version !== 'v1' || !body || !signature) {
    throw new OperationError('INVALID', 'This is not a valid Proposed Change token.');
  }
  const expected = Buffer.from(hmac(secret, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(new Uint8Array(expected), new Uint8Array(given))) {
    throw new OperationError('INVALID', 'This Proposed Change token has been altered or was not issued by EduHub.');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ProposalPayload;
  if (payload.exp * 1000 < now) {
    throw new OperationError('EXPIRED', 'This Proposed Change has expired. Ask for a new proposal.');
  }
  return payload;
};

/** Stable JSON: object keys sorted, so equal data always hashes the same. */
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
};

const sha256 = (value: unknown) => crypto.createHash('sha256').update(canonical(value)).digest('hex');

/**
 * Fingerprint of the part of a course a proposal touches. Course texts and settings use the course
 * row (including `updated_at`); Sessions use the Sessions and their Session Locations, which do not
 * change the course's `updated_at`. Registrations are not part of it: they are re-checked on apply.
 */
export const fingerprint = (course: CourseSnapshot, kind: ProposalKind): string => {
  if (kind === 'sessions') {
    const sessions = [...course.sessions].sort((a, b) => a.id - b.id);
    return sha256({ sessions, courseLocations: course.courseLocations });
  }
  return sha256({ updatedAt: course.updatedAt, fields: course.fields });
};
