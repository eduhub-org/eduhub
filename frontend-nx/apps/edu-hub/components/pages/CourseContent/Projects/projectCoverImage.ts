import { getPublicImageUrl, getPublicUrl } from '../../../../helpers/filehandling';

export const PROJECT_COVER_PLACEHOLDER_SRC = '/images/common/project-cover-placeholder.svg';

/** Matches FileUploadField preview / course tile resizing. */
const PROJECT_COVER_DISPLAY_SIZE = 460;

/**
 * Resolves a stored project cover path to a browser-loadable URL.
 * Upload UI does this internally; read-only previews must do the same.
 */
export function resolveProjectCoverImageSrc(coverImageUrl?: string | null): string {
  const path = coverImageUrl?.trim();
  if (!path) {
    return PROJECT_COVER_PLACEHOLDER_SRC;
  }

  const resized = getPublicImageUrl(path, PROJECT_COVER_DISPLAY_SIZE);
  if (resized) {
    return resized;
  }

  const publicUrl = getPublicUrl(path);
  if (publicUrl) {
    return publicUrl;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return PROJECT_COVER_PLACEHOLDER_SRC;
}
