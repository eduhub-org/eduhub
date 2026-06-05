import {
  safeProjectExternalHref,
  safeProjectInstructionHref,
  safeProjectResourceHref,
} from './projectMandatory';

const STORAGE_BUCKET_URL = 'https://storage.example.test/eduhub-bucket';

describe('project href helpers', () => {
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

  describe('safeProjectExternalHref', () => {
    it('allows only http(s) URLs', () => {
      expect(safeProjectExternalHref('https://example.test/demo')).toBe('https://example.test/demo');
      expect(safeProjectExternalHref('http://example.test/demo')).toBe('http://example.test/demo');
      expect(safeProjectExternalHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBeNull();
      expect(safeProjectExternalHref('project-docs-instructions/public/instruction-1/file.pdf')).toBeNull();
      expect(safeProjectExternalHref('javascript:alert(1)')).toBeNull();
    });
  });

  describe('safeProjectResourceHref (upload fields, GCS only)', () => {
    it('resolves public storage object keys', () => {
      expect(safeProjectResourceHref('project-docs-instructions/public/instruction-1/file.pdf')).toBe(
        `${STORAGE_BUCKET_URL}/project-docs-instructions/public/instruction-1/file.pdf`
      );
    });

    it('rejects static app paths, external URLs, and placeholders', () => {
      expect(safeProjectResourceHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBeNull();
      expect(safeProjectResourceHref('/api/internal/secret')).toBeNull();
      expect(safeProjectResourceHref('https://example.test/file.pdf')).toBeNull();
      expect(safeProjectResourceHref('project-docs-instructions/private/instruction-1/file.pdf')).toBeNull();
      expect(safeProjectResourceHref('pending_upload')).toBeNull();
      expect(safeProjectResourceHref('javascript:alert(1)')).toBeNull();
      expect(safeProjectResourceHref('//example.test/file.pdf')).toBeNull();
    });
  });

  describe('safeProjectInstructionHref (GCS keys + seeded static defaults)', () => {
    it('allows the seeded default-instruction static prefix', () => {
      expect(safeProjectInstructionHref('/project-documentation-instructions/CLASSIC_PROJECT.pdf')).toBe(
        '/project-documentation-instructions/CLASSIC_PROJECT.pdf'
      );
    });

    it('resolves public storage object keys', () => {
      expect(safeProjectInstructionHref('project-docs-instructions/public/instruction-1/file.pdf')).toBe(
        `${STORAGE_BUCKET_URL}/project-docs-instructions/public/instruction-1/file.pdf`
      );
    });

    it('rejects other same-origin paths, traversal, and external URLs', () => {
      expect(safeProjectInstructionHref('/api/internal/secret')).toBeNull();
      expect(
        safeProjectInstructionHref('/project-documentation-instructions/../../api/secret')
      ).toBeNull();
      expect(safeProjectInstructionHref('https://example.test/file.pdf')).toBeNull();
      expect(safeProjectInstructionHref('javascript:alert(1)')).toBeNull();
    });

    // Exact ProjectDocumentationInstruction.url values observed in production.
    it('resolves the real production instruction URL formats', () => {
      const staticDefaults = [
        '/project-documentation-instructions/CLASSIC_PROJECT.pdf',
        '/project-documentation-instructions/PROJECT_WITH_LINK.pdf',
        '/project-documentation-instructions/PROJECT_WITH_PRESENTATION.pdf',
        '/project-documentation-instructions/PROJECT_WITH_LINK_AND_PRESENTATION.pdf',
        '/project-documentation-instructions/PRESENTATION_WITHOUT_DOCUMENTATION.pdf',
        '/project-documentation-instructions/PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION.pdf',
      ];
      for (const path of staticDefaults) {
        expect(safeProjectInstructionHref(path)).toBe(path);
      }

      // Bucket object keys, including filenames that contain spaces.
      const bucketKeys = [
        'achievement-docs-templates/public/template-18/Reflexion_Future of Food.pdf',
        'achievement-docs-templates/public/template-11/Reflexion_Social Media Sessions.pdf',
        'achievement-docs-templates/public/template-15/Reflexion_Human Resources Sessions.pdf',
        'achievement-docs-templates/public/template-14/Reflexion_Projektarbeit in der Praxis.pdf',
        'achievement-docs-templates/public/template-20/Reflexion_Blockchain Sessions.pdf',
      ];
      for (const key of bucketKeys) {
        expect(safeProjectInstructionHref(key)).toBe(`${STORAGE_BUCKET_URL}/${key}`);
      }
    });
  });
});
