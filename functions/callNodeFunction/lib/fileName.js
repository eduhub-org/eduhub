/**
 * Sanitises a client-supplied file name before it is interpolated into a storage
 * object path.
 *
 * `replacePlaceholders` (lib/utils.js) substitutes action inputs into the
 * `file-path` header verbatim, so an unsanitised `filename` reaches the object
 * key. In production GCS does not resolve `..`, which caps the damage at
 * unreachable objects, but the emulated development bucket writes through `fs`
 * (lib/cloud-storage.js), where the OS does resolve it - an arbitrary file write.
 * Sanitising here fixes every saveFile/saveImage action at once.
 *
 * Also removes `$`, so a crafted name can no longer smuggle a RegExp replacement
 * pattern (`$&`, `$1`) through String.replace in replacePlaceholders.
 */
const MAX_LENGTH = 120;

/**
 * Anything outside letters/digits/dot/underscore/hyphen is not safe in an object
 * key. This deliberately also covers control characters (including a NUL that
 * could truncate the path), `$`, quotes, whitespace and path separators, so no
 * separate control-character pass is needed.
 */
const UNSAFE_CHARS = /[^\p{L}\p{N}._-]/gu;

export function sanitizeStoredFileName(rawName, fallback = 'upload') {
  const asString = typeof rawName === 'string' ? rawName : '';

  // Keep only the last path segment: defeats "../", absolute paths and Windows
  // separators in one step.
  const baseName = asString.split(/[/\\]/).pop() ?? '';

  const cleaned = baseName
    .normalize('NFC')
    .replace(UNSAFE_CHARS, '_')
    // A run of dots would otherwise leave a traversal fragment behind.
    .replace(/\.{2,}/g, '.')
    // Leading dots/underscores produce hidden or ugly object names.
    .replace(/^[._]+/, '');

  if (!cleaned || cleaned === '.') return fallback;
  if (cleaned.length <= MAX_LENGTH) return cleaned;

  // Truncate the stem but keep the extension, so validateFileUpload and the
  // content-type sniffing in cloud-storage still see the real suffix.
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot <= 0 || lastDot < cleaned.length - 12) {
    return cleaned.slice(0, MAX_LENGTH);
  }
  const extension = cleaned.slice(lastDot);
  const stem = cleaned.slice(0, lastDot);
  return `${stem.slice(0, Math.max(1, MAX_LENGTH - extension.length))}${extension}`;
}
