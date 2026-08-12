import { describe, expect, it } from '@jest/globals';
import { maxBase64LengthForBytes, validateFileUpload } from './fileValidation.js';

const PDF = Buffer.from('%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
const EMPTY_ZIP = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);
const COMPOUND_FILE = Buffer.alloc(512);
Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(COMPOUND_FILE);
COMPOUND_FILE.writeUInt16LE(0xfffe, 28);
COMPOUND_FILE.writeUInt16LE(9, 30);

describe('validateFileUpload', () => {
  it.each([
    ['submission.pdf', PDF],
    ['submission.DOC', COMPOUND_FILE],
    ['submission.docx', EMPTY_ZIP],
    ['submission.odt', EMPTY_ZIP],
    ['submission.zip', EMPTY_ZIP],
    ['slides.ppt', COMPOUND_FILE],
    ['slides.pptx', EMPTY_ZIP],
    ['slides.odp', EMPTY_ZIP],
  ])('accepts an allowed extension with the expected container for %s', (fileName, buffer) => {
    const allowed = '.pdf,.doc,.docx,.odt,.zip,.ppt,.pptx,.odp';
    expect(validateFileUpload(fileName, buffer, allowed)).toBe(true);
  });

  it('keeps documentation and presentation extension allowlists separate', () => {
    expect(validateFileUpload('submission.zip', EMPTY_ZIP, '.pdf,.ppt,.pptx,.odp')).toBe(false);
    expect(validateFileUpload('slides.pptx', EMPTY_ZIP, '.pdf,.doc,.docx,.odt,.zip')).toBe(false);
  });

  it('rejects malformed or obviously disguised content', () => {
    expect(validateFileUpload('truncated.zip', EMPTY_ZIP.subarray(0, 10), '.zip')).toBe(false);
    expect(validateFileUpload('marker.docx', Buffer.from('PK\x03\x04word/'), '.docx')).toBe(false);
    expect(validateFileUpload('document.doc', Buffer.from('{\\rtf1 text}'), '.doc')).toBe(false);
    expect(validateFileUpload('payload.pdf', EMPTY_ZIP, '.pdf')).toBe(false);
  });
});

describe('maxBase64LengthForBytes', () => {
  it('calculates the encoded allocation ceiling for the exact byte limit', () => {
    expect(maxBase64LengthForBytes(23_000_000)).toBe(30_666_668);
  });
});
