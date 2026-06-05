import { ProjectRow, ProjectTypeRow } from './types';
import { getPublicUrl } from '../../../../helpers/filehandling';

export const MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS =
  'rounded-lg ring-2 ring-error border border-error/50 bg-error/10';

export function isProjectResourceUrlPresent(url?: string | null): boolean {
  const u = url?.trim();
  return Boolean(u && u !== 'pending_upload');
}

/**
 * Restrict client-supplied URLs (documentationUrl/presentationUrl/externalUrl) to
 * http(s) so values like `javascript:` cannot be bound to anchor hrefs.
 */
export function safeProjectExternalHref(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed || trimmed === 'pending_upload') return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Resolve EduHub-owned project resource paths to hrefs that are safe to bind
 * to anchors. Resource values may be absolute URLs, static Next.js public
 * paths, or public storage object keys.
 */
export function safeProjectResourceHref(resourcePath?: string | null): string | null {
  const trimmed = resourcePath?.trim();
  if (!trimmed || trimmed === 'pending_upload') return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return null;
  } catch {
    /* fall through */
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  return getPublicUrl(trimmed);
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
