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

export function resolveProjectStatusChipKey(
  status: ProjectStatus_enum | string,
  rating?: ProjectRating_enum | null,
  suggestedForPublication?: boolean | null
): string {
  if (
    status === ProjectStatus_enum.COMPLETED &&
    suggestedForPublication
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
    'status' | 'ProjectAuthors' | 'rating' | 'suggestedForPublication'
  >
): string {
  const acceptedCount = (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
  ).length;

  if (
    acceptedCount === 0 &&
    project.status === ProjectStatus_enum.PROPOSED
  ) {
    return PROJECT_STATUS_CHIP_TEMPLATE;
  }

  return resolveProjectStatusChipKey(
    project.status,
    project.rating,
    project.suggestedForPublication
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

/** Project type and documentation instruction are editable only while PROPOSED. */
export function isProjectTypeEditable(status: ProjectStatus_enum): boolean {
  return status === ProjectStatus_enum.PROPOSED;
}

/** Staff may suggest or withdraw a publication recommendation for finished projects. */
export function canManagePublicationSuggestion(
  status: ProjectStatus_enum
): boolean {
  return status === ProjectStatus_enum.COMPLETED;
}
