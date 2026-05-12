import { ProjectRow, ProjectTypeRow } from './types';

export const isChecklistComplete = (
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean => {
  if (!projectType) return false;
  if (projectType.requiresDocumentation && !project.documentationUrl) return false;
  if (projectType.requiresPresentation && !project.presentationUrl) return false;
  if (projectType.requiresExternalUrl && !project.externalUrl) return false;
  if (projectType.requiresCoverImage && !project.coverImageUrl) return false;
  const authors = project.ProjectAuthors ?? [];
  if (authors.some((a) => a.participationStatus === 'REQUESTED')) return false;
  if (!authors.some((a) => a.participationStatus === 'ACCEPTED')) return false;
  return true;
};
