import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectAuthorRow } from './types';
import { getDisplayAuthors, isAcceptedAuthor, isExcludedAuthor } from './projectAuthors';

const author = (
  id: number,
  participationStatus: ProjectParticipationStatus_enum
): ProjectAuthorRow =>
  ({ id, userId: `u${id}`, participationStatus } as unknown as ProjectAuthorRow);

const accepted = author(1, ProjectParticipationStatus_enum.ACCEPTED);
const excluded = author(2, ProjectParticipationStatus_enum.EXCLUDED);
const requested = author(3, ProjectParticipationStatus_enum.REQUESTED);
const declined = author(4, ProjectParticipationStatus_enum.DECLINED);

describe('projectAuthors visibility', () => {
  it('classifies accepted and excluded authors', () => {
    expect(isAcceptedAuthor(accepted)).toBe(true);
    expect(isAcceptedAuthor(excluded)).toBe(false);
    expect(isExcludedAuthor(excluded)).toBe(true);
    expect(isExcludedAuthor(accepted)).toBe(false);
  });

  it('hides excluded authors by default (peer/public view)', () => {
    const result = getDisplayAuthors([accepted, excluded, requested, declined]);
    expect(result.map((a) => a.id)).toEqual([accepted.id]);
  });

  it('includes excluded authors when requested (instructor/owner view)', () => {
    const result = getDisplayAuthors([accepted, excluded, requested, declined], {
      includeExcluded: true,
    });
    expect(result.map((a) => a.id)).toEqual([accepted.id, excluded.id]);
  });

  it('never shows requested or declined authors', () => {
    const result = getDisplayAuthors([requested, declined], { includeExcluded: true });
    expect(result).toHaveLength(0);
  });

  it('handles null/undefined author lists', () => {
    expect(getDisplayAuthors(null)).toEqual([]);
    expect(getDisplayAuthors(undefined, { includeExcluded: true })).toEqual([]);
  });
});
