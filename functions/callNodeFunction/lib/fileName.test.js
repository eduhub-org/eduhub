import { sanitizeStoredFileName } from './fileName.js';

const NUL = String.fromCharCode(0);
const BACKSLASH = String.fromCharCode(92);

describe('sanitizeStoredFileName', () => {
  it('reduces a traversal attempt to its basename', () => {
    expect(sanitizeStoredFileName('../../evil.pdf')).toBe('evil.pdf');
    expect(sanitizeStoredFileName('../../../etc/passwd')).toBe('passwd');
    expect(
      sanitizeStoredFileName(`..${BACKSLASH}..${BACKSLASH}evil.pdf`)
    ).toBe('evil.pdf');
    expect(sanitizeStoredFileName('/absolute/path/doc.pdf')).toBe('doc.pdf');
  });

  it('leaves no path separator or dot-run behind', () => {
    const result = sanitizeStoredFileName('a/../../b.pdf');
    expect(result).not.toContain('/');
    expect(result).not.toContain('..');
  });

  it('neutralises RegExp replacement patterns', () => {
    // replacePlaceholders builds the object key with String.replace, where `$&`
    // and `$1` in the replacement value would be interpreted.
    expect(sanitizeStoredFileName('a$&b.pdf')).toBe('a__b.pdf');
    expect(sanitizeStoredFileName('$1.pdf')).toBe('1.pdf');
  });

  it('strips control characters', () => {
    expect(sanitizeStoredFileName(`doc${NUL}.pdf`)).toBe('doc_.pdf');
  });

  it('keeps letters, digits, dots, underscores and hyphens, including non-ASCII', () => {
    expect(sanitizeStoredFileName('Leitfaden-v2_final.pdf')).toBe(
      'Leitfaden-v2_final.pdf'
    );
    expect(sanitizeStoredFileName('Übung.pdf')).toBe('Übung.pdf');
  });

  it('replaces spaces rather than dropping them', () => {
    expect(sanitizeStoredFileName('my doc.pdf')).toBe('my_doc.pdf');
  });

  it('falls back when nothing usable remains', () => {
    expect(sanitizeStoredFileName('...')).toBe('upload');
    expect(sanitizeStoredFileName('')).toBe('upload');
    expect(sanitizeStoredFileName('/')).toBe('upload');
    expect(sanitizeStoredFileName(undefined)).toBe('upload');
    expect(sanitizeStoredFileName(null)).toBe('upload');
    expect(sanitizeStoredFileName(42)).toBe('upload');
    expect(sanitizeStoredFileName('...', 'instruction')).toBe('instruction');
  });

  it('does not produce a hidden file', () => {
    expect(sanitizeStoredFileName('.hidden.pdf')).toBe('hidden.pdf');
    expect(sanitizeStoredFileName('.env')).toBe('env');
  });

  it('caps the length while preserving the extension', () => {
    const result = sanitizeStoredFileName(`${'x'.repeat(200)}.pdf`);
    expect(result.length).toBeLessThanOrEqual(120);
    // The extension has to survive: validateFileUpload and the content-type
    // sniffing in cloud-storage both key off it.
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('caps the length when there is no usable extension', () => {
    const result = sanitizeStoredFileName('y'.repeat(200));
    expect(result).toBe('y'.repeat(120));
  });
});
