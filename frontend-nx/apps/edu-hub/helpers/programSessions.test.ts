import { isProgramSession, mergeSessions } from './programSessions';

type TestSession = { id: number; startDateTime: Date | string; programId?: number | null };

describe('program sessions', () => {
  it('merges course and program sessions chronologically', () => {
    const course: TestSession[] = [
      { id: 1, startDateTime: '2026-03-12T17:00:00Z', programId: null },
      { id: 2, startDateTime: new Date('2026-03-26T17:00:00Z'), programId: null },
    ];
    const program: TestSession[] = [{ id: 9, startDateTime: '2026-03-19T16:00:00Z', programId: 4 }];

    expect(mergeSessions(course, program).map((s) => s.id)).toEqual([1, 9, 2]);
  });

  it('breaks ties by id and tolerates missing lists', () => {
    const a = { id: 5, startDateTime: '2026-03-12T17:00:00Z' };
    const b = { id: 3, startDateTime: '2026-03-12T17:00:00Z' };

    expect(mergeSessions([a], [b]).map((s) => s.id)).toEqual([3, 5]);
    expect(mergeSessions(undefined, [a])).toEqual([a]);
    expect(mergeSessions(null, null)).toEqual([]);
  });

  it('identifies program sessions by their programId', () => {
    expect(isProgramSession({ programId: 4 })).toBe(true);
    expect(isProgramSession({ programId: null })).toBe(false);
    expect(isProgramSession({})).toBe(false);
  });
});
