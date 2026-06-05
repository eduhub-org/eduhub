import { getPublicUrl, getSafeFileHref, isStaticAppPath } from './filehandling';

const STORAGE_BUCKET_URL = 'https://storage.example.test/eduhub-bucket';
const STATIC_PREFIX = '/project-documentation-instructions/';

describe('filehandling', () => {
  const previousStorageBucketUrl = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = STORAGE_BUCKET_URL;
  });

  afterAll(() => {
    if (previousStorageBucketUrl === undefined) {
      delete process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
    } else {
      process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = previousStorageBucketUrl;
    }
  });

  describe('isStaticAppPath', () => {
    it('matches same-origin paths but not protocol-relative ones', () => {
      expect(isStaticAppPath('/foo/bar.pdf')).toBe(true);
      expect(isStaticAppPath('//example.test/x')).toBe(false);
      expect(isStaticAppPath('foo/bar.pdf')).toBe(false);
    });
  });

  describe('getPublicUrl', () => {
    it('does not treat static app paths as public files', () => {
      expect(getPublicUrl('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBeNull();
    });

    it('resolves public storage object keys', () => {
      expect(getPublicUrl('project-docs-instructions/public/instruction-1/file.pdf')).toBe(
        `${STORAGE_BUCKET_URL}/project-docs-instructions/public/instruction-1/file.pdf`
      );
    });

    it('returns legacy http(s) URLs unchanged', () => {
      expect(getPublicUrl('https://example.test/legacy.pdf')).toBe('https://example.test/legacy.pdf');
    });

    it('returns null for private or empty paths', () => {
      expect(getPublicUrl('project-docs-instructions/private/instruction-1/file.pdf')).toBeNull();
      expect(getPublicUrl('')).toBeNull();
    });
  });

  describe('getSafeFileHref', () => {
    it('resolves storage keys while rejecting external URLs', () => {
      expect(
        getSafeFileHref('achievement-docs-templates/public/template-15/file.pdf', {
          rejectExternalUrls: true,
        })
      ).toBe(`${STORAGE_BUCKET_URL}/achievement-docs-templates/public/template-15/file.pdf`);
      expect(getSafeFileHref('https://example.test/file.pdf', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('http://example.test/file.pdf', { rejectExternalUrls: true })).toBeNull();
    });

    it('allows legacy http(s) URLs by default', () => {
      expect(getSafeFileHref('https://example.test/file.pdf')).toBe('https://example.test/file.pdf');
    });

    it('rejects static app paths unless explicitly allowlisted', () => {
      expect(getSafeFileHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBeNull();
      expect(getSafeFileHref('/api/internal/secret')).toBeNull();
      expect(
        getSafeFileHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf', {
          allowedStaticPrefixes: [STATIC_PREFIX],
        })
      ).toBe('/project-documentation-instructions/CLASSIC_PROJECT.pdf');
    });

    it('rejects allowlisted static paths that attempt parent traversal', () => {
      expect(
        getSafeFileHref('/project-documentation-instructions/../../api/secret', {
          allowedStaticPrefixes: [STATIC_PREFIX],
        })
      ).toBeNull();
    });

    it('rejects non-allowlisted same-origin paths even when prefixes are provided', () => {
      expect(
        getSafeFileHref('/api/internal/secret', { allowedStaticPrefixes: [STATIC_PREFIX] })
      ).toBeNull();
    });

    it('rejects unresolved, placeholder, and unsafe protocol values', () => {
      expect(getSafeFileHref('pending_upload', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('javascript:alert(1)', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('javascript:alert(1)/public/file.pdf', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('data:text/html,<script>alert(1)</script>', { rejectExternalUrls: true })).toBeNull();
      expect(getSafeFileHref('//example.test/file.pdf', { rejectExternalUrls: true })).toBeNull();
    });
  });
});
