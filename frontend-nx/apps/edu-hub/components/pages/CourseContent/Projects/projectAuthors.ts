import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectAuthorRow } from './types';

/** A confirmed implementing author of the project. */
export const isAcceptedAuthor = (author: ProjectAuthorRow): boolean =>
  author.participationStatus === ProjectParticipationStatus_enum.ACCEPTED;

/**
 * An author the submitting author marked as not having contributed to the
 * final submission. Excluded authors are hidden from the public/peer author
 * list but stay visible to instructors and admins, and to the author
 * themselves in their "My Project" panel.
 */
export const isExcludedAuthor = (author: ProjectAuthorRow): boolean =>
  author.participationStatus === ProjectParticipationStatus_enum.EXCLUDED;

/**
 * Authors shown in a project's author list.
 *
 * Always includes ACCEPTED authors. EXCLUDED authors are included only when
 * `includeExcluded` is set — i.e. for privileged viewers (instructors/admins)
 * or in the excluded author's own "My Project" view. Order is preserved so an
 * ACCEPTED/EXCLUDED marker can be derived per row at render time.
 */
export const getDisplayAuthors = (
  authors: readonly ProjectAuthorRow[] | undefined | null,
  options?: { includeExcluded?: boolean }
): ProjectAuthorRow[] => {
  const includeExcluded = options?.includeExcluded ?? false;
  return (authors ?? []).filter(
    (author) => isAcceptedAuthor(author) || (includeExcluded && isExcludedAuthor(author))
  );
};
