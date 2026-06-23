import { ProjectsByCourse_Project } from '../../../../queries/__generated__/ProjectsByCourse';
import { ProjectTypes_ProjectType } from '../../../../queries/__generated__/ProjectTypes';

export type ProjectRow = ProjectsByCourse_Project & {
  projectReviewRequestedAt?: string | null;
};
export type ProjectAuthorRow = ProjectRow['ProjectAuthors'][number];
export type ProjectMentorRow = ProjectRow['ProjectMentors'][number];
export type ProjectTypeRow = ProjectTypes_ProjectType;

/**
 * The deliverable-requirement fields shared by the project-type catalog row
 * (`ProjectTypeRow`) and the type embedded on a project (`project.ProjectType`).
 * Checklist / next-step logic only needs these flags, so accepting this narrower
 * shape lets callers pass the project's own (user-readable) type without the
 * instructor-only catalog fields.
 */
export type ProjectTypeRequirements = Pick<
  ProjectTypeRow,
  | 'value'
  | 'requiresDocumentation'
  | 'requiresPresentation'
  | 'requiresExternalUrl'
  | 'requiresCoverImage'
>;
