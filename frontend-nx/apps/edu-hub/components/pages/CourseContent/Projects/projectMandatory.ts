import { ProjectRow, ProjectTypeRequirements } from './types';
import { getSafeFileHref } from '../../../../helpers/filehandling';

/** Static path prefix for migration-seeded default instruction PDFs in `public/`. */
const PROJECT_DOCUMENTATION_INSTRUCTION_STATIC_PREFIX = '/project-documentation-instructions/';

export const MANDATORY_INCOMPLETE_HIGHLIGHT_CLASS =
  'rounded-lg ring-2 ring-error border border-error/50 bg-error/10';

export function isProjectResourceUrlPresent(url?: string | null): boolean {
  const u = url?.trim();
  return Boolean(u && u !== 'pending_upload');
}

/**
 * Restrict client-supplied external URLs (externalUrl) to http(s) so values like
 * `javascript:` cannot be bound to anchor hrefs.
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
 * Project upload fields (documentationUrl, presentationUrl). These are
 * user-controlled and only ever hold GCS object keys, so static app paths and
 * external URLs are rejected.
 */
export function safeProjectResourceHref(resourcePath?: string | null): string | null {
  return getSafeFileHref(resourcePath, { rejectExternalUrls: true });
}

/**
 * Documentation-instruction `url`. Admin/migration controlled: either a GCS
 * object key or the seeded default PDF under the static instructions prefix.
 */
export function safeProjectInstructionHref(instructionUrl?: string | null): string | null {
  return getSafeFileHref(instructionUrl, {
    rejectExternalUrls: true,
    allowedStaticPrefixes: [PROJECT_DOCUMENTATION_INSTRUCTION_STATIC_PREFIX],
  });
}

export function isProjectDocumentationIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): boolean {
  return Boolean(projectType?.requiresDocumentation && !isProjectResourceUrlPresent(project.documentationUrl));
}

export function isProjectPresentationIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): boolean {
  return Boolean(projectType?.requiresPresentation && !isProjectResourceUrlPresent(project.presentationUrl));
}

export function isProjectExternalUrlIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): boolean {
  return Boolean(projectType?.requiresExternalUrl && !isProjectResourceUrlPresent(project.externalUrl));
}

export function isProjectCoverImageIncomplete(
  project: ProjectRow,
  projectType: ProjectTypeRequirements | null | undefined
): boolean {
  return Boolean(projectType?.requiresCoverImage && !project.coverImageUrl?.trim());
}
