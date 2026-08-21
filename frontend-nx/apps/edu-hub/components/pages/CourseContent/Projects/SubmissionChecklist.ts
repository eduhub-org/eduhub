import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow, ProjectTypeRequirements } from './types';
import {
  isProjectCoverImageIncomplete,
  isProjectDocumentationIncomplete,
  isProjectExternalUrlIncomplete,
  isProjectPresentationIncomplete,
} from './projectMandatory';

/**
 * Everything that can keep an ONGOING project from being submitted. Both the
 * "Nächste Schritte" checklist and the blocked-submission dialog are derived
 * from this single list so the two can never disagree with the submit button.
 */
export type ProjectSubmissionBlocker =
  | 'type'
  | 'documentation'
  | 'presentation'
  | 'externalUrl'
  | 'coverImage'
  | 'authorsPending'
  | 'authorsNoneAccepted'
  | 'deadline';

/** One requirement row of the submission checklist, with its current state. */
export interface ProjectSubmissionRequirement {
  /** Never `'deadline'` — the deadline is not a task the team can tick off. */
  key: Exclude<ProjectSubmissionBlocker, 'deadline'>;
  satisfied: boolean;
}

interface ProjectSubmissionBlockerOptions {
  isSubmissionDeadlinePassed?: boolean;
}

/**
 * DOM ids of the panel fields a blocker can be fixed in, so the blocked-submission
 * dialog can jump straight to the offending field.
 */
export const PROJECT_SUBMISSION_FIELD_ANCHOR_ID: Partial<
  Record<ProjectSubmissionBlocker, string>
> = {
  documentation: 'project-field-documentation',
  presentation: 'project-field-presentation',
  externalUrl: 'project-field-external-url',
  coverImage: 'project-field-cover-image',
};

/**
 * Every requirement that applies to this project, satisfied or not. Deliverables
 * come from the project's type; the author rows apply to every type (a project
 * cannot be submitted while a join request is pending, and it needs at least one
 * confirmed author).
 */
export const getProjectSubmissionRequirements = (
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): ProjectSubmissionRequirement[] => {
  // Without a type the deliverables are unknown — the instructor has to set it
  // first, so it is the only requirement worth showing.
  if (!projectType) return [{ key: 'type', satisfied: false }];

  const requirements: ProjectSubmissionRequirement[] = [];

  if (projectType.requiresDocumentation) {
    requirements.push({
      key: 'documentation',
      satisfied: !isProjectDocumentationIncomplete(project, projectType),
    });
  }
  if (projectType.requiresPresentation) {
    requirements.push({
      key: 'presentation',
      satisfied: !isProjectPresentationIncomplete(project, projectType),
    });
  }
  if (projectType.requiresExternalUrl) {
    requirements.push({
      key: 'externalUrl',
      satisfied: !isProjectExternalUrlIncomplete(project, projectType),
    });
  }
  if (projectType.requiresCoverImage) {
    requirements.push({
      key: 'coverImage',
      satisfied: !isProjectCoverImageIncomplete(project, projectType),
    });
  }

  const authors = project.ProjectAuthors ?? [];
  requirements.push({
    key: 'authorsPending',
    satisfied: !authors.some(
      (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
    ),
  });
  // Only surfaced when unsatisfied: a project with confirmed authors should not
  // carry a checklist row for merely existing.
  if (
    !authors.some(
      (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
    )
  ) {
    requirements.push({ key: 'authorsNoneAccepted', satisfied: false });
  }

  return requirements;
};

/**
 * The reasons submission is currently impossible, in the order they should be
 * shown: the deadline first (nothing else can be fixed once it has passed),
 * then the open requirements.
 */
export const getProjectSubmissionBlockers = (
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined,
  { isSubmissionDeadlinePassed = false }: ProjectSubmissionBlockerOptions = {}
): ProjectSubmissionBlocker[] => [
  ...(isSubmissionDeadlinePassed ? (['deadline'] as const) : []),
  ...getProjectSubmissionRequirements(project, projectType)
    .filter((requirement) => !requirement.satisfied)
    .map((requirement) => requirement.key),
];

export const isChecklistComplete = (
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): boolean => getProjectSubmissionBlockers(project, projectType).length === 0;
