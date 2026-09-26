/**
 * Program sessions are Session rows owned by a program (programId set) rather
 * than a course. They show up in every course of the program, merged into the
 * course's own schedule.
 */

interface SessionLike {
  id: number;
  startDateTime: Date | string;
  programId?: number | null;
}

export const isProgramSession = (session: { programId?: number | null }): boolean => session.programId != null;

const startTime = (session: SessionLike): number => new Date(session.startDateTime).getTime();

/** Course and program sessions in one chronological list (ties broken by id). */
export function mergeSessions<T extends SessionLike>(
  courseSessions: readonly T[] | null | undefined,
  programSessions: readonly T[] | null | undefined
): T[] {
  return [...(courseSessions ?? []), ...(programSessions ?? [])].sort(
    (a, b) => startTime(a) - startTime(b) || a.id - b.id
  );
}
