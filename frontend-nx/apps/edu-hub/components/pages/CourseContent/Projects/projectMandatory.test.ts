import {
  safeProjectExternalHref,
  safeProjectResourceHref,
} from './projectMandatory';

const STORAGE_BUCKET_URL = 'https://storage.example.test/eduhub-bucket';

describe('project href helpers', () => {
  const previousStorageBucketUrl = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = STORAGE_BUCKET_URL;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = previousStorageBucketUrl;
  });

  describe('safeProjectExternalHref', () => {
    it('allows only http(s) URLs', () => {
      expect(safeProjectExternalHref('https://example.test/demo')).toBe('https://example.test/demo');
      expect(safeProjectExternalHref('http://example.test/demo')).toBe('http://example.test/demo');
      expect(safeProjectExternalHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBeNull();
      expect(safeProjectExternalHref('project-docs-instructions/public/instruction-1/file.pdf')).toBeNull();
      expect(safeProjectExternalHref('javascript:alert(1)')).toBeNull();
    });
  });

  describe('safeProjectResourceHref', () => {
    it('allows http(s) URLs', () => {
      expect(safeProjectResourceHref('https://example.test/file.pdf')).toBe('https://example.test/file.pdf');
    });

    it('allows same-origin static app paths', () => {
      expect(safeProjectResourceHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBe(
        '/project-documentation-instructions/CLASSIC_PROJECT.pdf'
      );
    });

    it('resolves public storage object keys', () => {
      expect(safeProjectResourceHref('project-docs-instructions/public/instruction-1/file.pdf')).toBe(
        `${STORAGE_BUCKET_URL}/project-docs-instructions/public/instruction-1/file.pdf`
      );
    });

    it('rejects unresolved or placeholder values', () => {
      expect(safeProjectResourceHref('pending_upload')).toBeNull();
      expect(safeProjectResourceHref('project-docs-instructions/private/instruction-1/file.pdf')).toBeNull();
      expect(safeProjectResourceHref('')).toBeNull();
    });

    it('rejects unsafe absolute protocols before storage-path handling', () => {
      expect(safeProjectResourceHref('javascript:alert(1)')).toBeNull();
      expect(safeProjectResourceHref('javascript:alert(1)/public/file.pdf')).toBeNull();
      expect(safeProjectResourceHref('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(safeProjectResourceHref('//example.test/file.pdf')).toBeNull();
    });
  });
});
