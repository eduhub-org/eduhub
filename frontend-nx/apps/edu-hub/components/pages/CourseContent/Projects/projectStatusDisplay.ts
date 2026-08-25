import {
  ProjectParticipationStatus_enum,
  ProjectRating_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { ProjectRow } from './types';

/** Status chip key for course project list: open templates without authors. */
export const PROJECT_STATUS_CHIP_TEMPLATE = 'TEMPLATE';

/** Status chip key when a completed project was approved (passed). */
export const PROJECT_STATUS_CHIP_COMPLETED_PASSED = 'COMPLETED_PASSED';

/** Status chip key when a completed project was rejected (failed). */
export const PROJECT_STATUS_CHIP_INCOMPLETE_FAILED = 'INCOMPLETE_FAILED';

/** Status chip key when staff suggested a completed project for publication. */
export const PROJECT_STATUS_CHIP_SUGGESTED_FOR_PUBLICATION =
  'SUGGESTED_FOR_PUBLICATION';

/**
 * An "open template" is a project anyone can still claim/join: no ACCEPTED
 * authors yet and still in PROPOSED. This is orthogonal to publication — a
 * published project can also be an open template (a showcased template).
 *
 * The public tile/page fragments only expose already-visible (ACCEPTED) authors
 * and omit `participationStatus`; a missing status is therefore treated as
 * ACCEPTED so the predicate works for both the admin `ProjectRow` shape and the
 * anonymous fragments.
 */
export function isOpenTemplate(project: {
  status: ProjectStatus_enum | string;
  ProjectAuthors?: ReadonlyArray<{
    participationStatus?: ProjectParticipationStatus_enum | string | null;
  } & Record<string, any>> | null;
}): boolean {
  const acceptedCount = (project.ProjectAuthors ?? []).filter(
    (a) =>
      a.participationStatus == null ||
      a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
  ).length;
  return acceptedCount === 0 && project.status === ProjectStatus_enum.PROPOSED;
}

/** True when the project is a published showcase (orthogonal to lifecycle). */
export function isProjectPublished(project: {
  published?: boolean | null;
}): boolean {
  return project.published === true;
}

export function resolveProjectStatusChipKey(
  status: ProjectStatus_enum | string,
  rating?: ProjectRating_enum | null,
  suggestedForPublication?: boolean | null,
  published?: boolean | null
): string {
  // Once published, the publication recommendation is fulfilled — never show
  // the amber "suggested for publication" chip (it would otherwise win over the
  // Passed chip on a published, completed project).
  if (
    status === ProjectStatus_enum.COMPLETED &&
    suggestedForPublication &&
    !published
  ) {
    return PROJECT_STATUS_CHIP_SUGGESTED_FOR_PUBLICATION;
  }
  if (
    status === ProjectStatus_enum.COMPLETED &&
    rating === ProjectRating_enum.PASSED
  ) {
    return PROJECT_STATUS_CHIP_COMPLETED_PASSED;
  }
  if (
    status === ProjectStatus_enum.INCOMPLETE &&
    rating === ProjectRating_enum.FAILED
  ) {
    return PROJECT_STATUS_CHIP_INCOMPLETE_FAILED;
  }
  return status;
}

export function getProjectStatusChipKey(
  project: Pick<
    ProjectRow,
    'status' | 'ProjectAuthors' | 'rating' | 'suggestedForPublication' | 'published'
  >
): string {
  if (isOpenTemplate(project)) {
    return PROJECT_STATUS_CHIP_TEMPLATE;
  }

  return resolveProjectStatusChipKey(
    project.status,
    project.rating,
    project.suggestedForPublication,
    project.published
  );
}

export const PROJECT_TYPE_ONLINE_COURSE = 'ONLINE_COURSE';

export function isOnlineCourseProject(
  project: { type?: string | null; ProjectType?: { value?: string | null } | null }
): boolean {
  return (
    project.type === PROJECT_TYPE_ONLINE_COURSE ||
    project.ProjectType?.value === PROJECT_TYPE_ONLINE_COURSE
  );
}

/** Download / external-link buttons in project preview (student list & panel). */
export function shouldShowProjectResourceDownloadLinks(
  status: ProjectStatus_enum
): boolean {
  return (
    status === ProjectStatus_enum.COMPLETED ||
    status === ProjectStatus_enum.PUBLISHED
  );
}

/**
 * Whether a stored `ratingComment` predates the review round currently in
 * flight.
 *
 * The set_project_submitted_metadata trigger keeps the comment across a
 * resubmission (so the course team can still see what they asked for while they
 * review the revision) but always resets the rating to UNRATED. A project in
 * SUBMITTED therefore carries no verdict of its own, and whatever comment sits
 * on the row is the previous round's — worth labelling as such, and worth
 * keeping out of the review dialog's input so it can never be mailed out again
 * as feedback on a verdict nobody wrote it for.
 */
export function isProjectReviewCommentFromPreviousRound(
  status: ProjectStatus_enum | string
): boolean {
  return status === ProjectStatus_enum.SUBMITTED;
}

/**
 * Project type and documentation instruction stay editable until the team
 * submits. Instructors and mentors may still correct the type after confirming
 * the team (PROPOSED -> ONGOING), including after a send-back
 * (SUBMITTED -> ONGOING), but never once the project is SUBMITTED, COMPLETED,
 * INCOMPLETE or PUBLISHED.
 *
 * Note for callers: outside PROPOSED the database requires a non-null
 * documentationInstructionId (Project_ongoing_requires_type_and_instruction_check),
 * so any type change made under this predicate must supply a matching instruction.
 */
export function isProjectTypeEditable(status: ProjectStatus_enum): boolean {
  return (
    status === ProjectStatus_enum.PROPOSED ||
    status === ProjectStatus_enum.ONGOING
  );
}

/** Staff may suggest or withdraw a publication recommendation for finished projects. */
export function canManagePublicationSuggestion(
  status: ProjectStatus_enum
): boolean {
  return status === ProjectStatus_enum.COMPLETED;
}
