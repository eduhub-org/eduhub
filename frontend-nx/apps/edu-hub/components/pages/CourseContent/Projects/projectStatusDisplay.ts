import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { ProjectRow } from './types';

/** Status chip key for course project list: open templates without authors. */
export const PROJECT_STATUS_CHIP_TEMPLATE = 'TEMPLATE';

export function getProjectStatusChipKey(
  project: Pick<ProjectRow, 'status' | 'ProjectAuthors'>
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

  return project.status;
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
