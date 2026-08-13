import { validateFileType } from './utils';

describe('validateFileType', () => {
  const documentTypes = '.pdf,.doc,.docx,.odt';

  it('accepts an allowed extension when the browser MIME type is empty', () => {
    expect(validateFileType('documentation.odt', '', documentTypes)).toBe(true);
  });

  it('matches extensions case-insensitively', () => {
    expect(validateFileType('DOCUMENTATION.ODT', undefined, documentTypes)).toBe(true);
  });

  it('rejects a disallowed extension even when its MIME type claims to be allowed', () => {
    expect(validateFileType('payload.exe', 'application/pdf', documentTypes)).toBe(false);
    expect(validateFileType('page.html', 'application/pdf', documentTypes)).toBe(false);
  });

  it('accepts explicit MIME types and wildcard MIME categories', () => {
    expect(validateFileType('document', 'application/pdf', 'application/pdf')).toBe(true);
    expect(validateFileType('photo.png', 'image/png', 'image/*')).toBe(true);
  });

  it('infers a MIME type from the extension when the browser MIME type is empty', () => {
    expect(validateFileType('photo.PNG', '', 'image/*')).toBe(true);
  });

  it('rejects files that match neither an allowed extension nor MIME type', () => {
    expect(validateFileType('notes.txt', 'text/plain', documentTypes)).toBe(false);
  });

  it('accepts any file when no restriction is configured', () => {
    expect(validateFileType('payload.exe', 'application/octet-stream', '*')).toBe(true);
  });

  it.each(['application/zip', 'application/x-zip-compressed', ''])(
    'accepts ZIP by extension when the browser reports MIME type %p',
    (fileType) => {
      expect(validateFileType('submission.ZIP', fileType, `${documentTypes},.zip`)).toBe(true);
    }
  );

  it('does not accept ZIP when only presentation formats are allowed', () => {
    expect(validateFileType('submission.zip', 'application/zip', '.pdf,.ppt,.pptx,.odp')).toBe(false);
  });
});
