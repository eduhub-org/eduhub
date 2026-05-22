import { ProjectRow, ProjectTypeRow } from './types';

export const MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS =
  'rounded-lg ring-2 ring-error border border-error/50 bg-error/10';

export function isProjectResourceUrlPresent(url?: string | null): boolean {
  const u = url?.trim();
  return Boolean(u && u !== 'pending_upload');
}

export function isProjectDocumentationIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean {
  return Boolean(projectType?.requiresDocumentation && !isProjectResourceUrlPresent(project.documentationUrl));
}

export function isProjectPresentationIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean {
  return Boolean(projectType?.requiresPresentation && !isProjectResourceUrlPresent(project.presentationUrl));
}

export function isProjectExternalUrlIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean {
  return Boolean(projectType?.requiresExternalUrl && !isProjectResourceUrlPresent(project.externalUrl));
}

export function isProjectCoverImageIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean {
  return Boolean(projectType?.requiresCoverImage && !project.coverImageUrl?.trim());
}
