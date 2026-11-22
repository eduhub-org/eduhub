/**
 * Errors the course-setup operations return to MCP clients. `code` is stable and machine-readable;
 * `message` is plain English for the client (the Assistant rephrases it for the Organizer).
 */
export type OperationErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'INVALID'
  | 'NO_CHANGE'
  | 'REGISTRATIONS_EXIST'
  | 'STALE'
  | 'ALREADY_APPLIED'
  | 'EXPIRED'
  | 'HASURA_ERROR';

export class OperationError extends Error {
  constructor(public readonly code: OperationErrorCode, message: string) {
    super(message);
    this.name = 'OperationError';
  }
}
