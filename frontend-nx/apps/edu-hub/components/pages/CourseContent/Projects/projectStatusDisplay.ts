import {
  ProjectParticipationStatus_enum,
  ProjectRating_enum,
  ProjectStatus_enum,
  Project_bool_exp,
} from '../../../../__generated__/globalTypes';
import { AuthRoles } from '../../../../types/enums';
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

/** Status chip key for an ongoing project that a review returned to its team (sentBackAt set). */
export const PROJECT_STATUS_CHIP_SENT_BACK = 'SENT_BACK';

/**
 * The nine Project Statuses (CONTEXT.md glossary) as chip keys. Their labels live under
 * `course.projects.status.<key>`.
 */
export type ProjectStatusKey =
  | 'TEMPLATE' // Project Template
  | 'PROPOSED' // Awaiting Confirmation
  | 'ONGOING' // Ongoing
  | 'SENT_BACK' // Sent Back
  | 'SUBMITTED' // Submitted
  | 'COMPLETED_PASSED' // Passed
  | 'SUGGESTED_FOR_PUBLICATION' // Suggested for Publication
  | 'PUBLISHED' // Published
  | 'INCOMPLETE_FAILED'; // Not Passed

/**
 * The Project Statuses in lifecycle order. A status's position in this list is its rank in the
 * SQL function `project_status_rank` (computed field `Project.projectStatusRank`); keep the two
 * in sync.
 */
export const PROJECT_STATUSES: readonly ProjectStatusKey[] = [
  'TEMPLATE',
  'PROPOSED',
  'ONGOING',
  'SENT_BACK',
  'SUBMITTED',
  'COMPLETED_PASSED',
  'SUGGESTED_FOR_PUBLICATION',
  'PUBLISHED',
  'INCOMPLETE_FAILED',
];

/** The `projectStatusRank` value the server computes for a Project Status. */
export function projectStatusRank(status: ProjectStatusKey): number {
  return PROJECT_STATUSES.indexOf(status);
}

/**
 * Hasura condition matching projects in any of the given Project Statuses. No status selected
 * means no restriction.
 */
export function projectStatusWhere(statuses: readonly ProjectStatusKey[]): Project_bool_exp {
  if (statuses.length === 0) {
    return {};
  }
  const ranks = Array.from(new Set(statuses.map(projectStatusRank))).sort((a, b) => a - b);
  return { projectStatusRank: { _in: ranks } };
}

/**
 * Needs Attention (CONTEXT.md): the projects waiting for a decision the viewer can make. Everyone
 * managing projects confirms and reviews them; only Admins also publish.
 */
export function needsAttentionStatuses(role: AuthRoles | string): ProjectStatusKey[] {
  const statuses: ProjectStatusKey[] = ['PROPOSED', 'SUBMITTED'];
  if (role === AuthRoles.admin) {
    statuses.push('SUGGESTED_FOR_PUBLICATION');
  }
  return statuses;
}

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

/**
 * The project's Project Status (a ProjectStatusKey; an unknown raw status is passed through).
 * Mirrors the SQL function `project_status_rank` (computed field Project.projectStatusRank), by
 * which the projects overview sorts and filters; keep the two in sync.
 */
export function getProjectStatusChipKey(
  project: Pick<
    ProjectRow,
    'status' | 'ProjectAuthors' | 'suggestedForPublication' | 'published' | 'sentBackAt'
  >
): string {
  if (isOpenTemplate(project)) {
    return PROJECT_STATUS_CHIP_TEMPLATE;
  }
  if (project.published || project.status === ProjectStatus_enum.PUBLISHED) {
    return ProjectStatus_enum.PUBLISHED;
  }
  switch (project.status) {
    case ProjectStatus_enum.ONGOING:
      return project.sentBackAt ? PROJECT_STATUS_CHIP_SENT_BACK : ProjectStatus_enum.ONGOING;
    case ProjectStatus_enum.COMPLETED:
      return project.suggestedForPublication
        ? PROJECT_STATUS_CHIP_SUGGESTED_FOR_PUBLICATION
        : PROJECT_STATUS_CHIP_COMPLETED_PASSED;
    case ProjectStatus_enum.INCOMPLETE:
      return PROJECT_STATUS_CHIP_INCOMPLETE_FAILED;
    default:
      return project.status;
  }
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

export type PublicationDecision = 'granted' | 'declined';

/**
 * The team's publication decision as staff see it. Teams decide when they submit, so from then on
 * there are only two states: the latest consent event is "granted", or not (declining at
 * submission stores no event, a later withdrawal stores "withdrawn"). Before submission, and for
 * online courses, which never ask for consent, there is no decision.
 */
export function getPublicationDecision(project: {
  status: ProjectStatus_enum | string;
  type?: string | null;
  ProjectType?: { value?: string | null } | null;
  ProjectConsentEvents?: { eventType: string }[] | null;
}): PublicationDecision | null {
  const isPostSubmission =
    project.status === ProjectStatus_enum.SUBMITTED ||
    project.status === ProjectStatus_enum.COMPLETED ||
    // A reviewed submission that was not accepted still carries the team's decision.
    project.status === ProjectStatus_enum.INCOMPLETE ||
    project.status === ProjectStatus_enum.PUBLISHED;
  if (!isPostSubmission || isOnlineCourseProject(project)) {
    return null;
  }
  return project.ProjectConsentEvents?.[0]?.eventType === 'granted' ? 'granted' : 'declined';
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

/**
 * A project rated as passed, published or not. Nobody may delete it: it holds the work an
 * achievement certificate rests on. Mirrors the database guard `prevent_deleting_passed_project`.
 */
export function isPassedProject(project: {
  status: ProjectStatus_enum;
  published: boolean;
}): boolean {
  return (
    project.status === ProjectStatus_enum.COMPLETED ||
    project.status === ProjectStatus_enum.PUBLISHED ||
    project.published
  );
}
