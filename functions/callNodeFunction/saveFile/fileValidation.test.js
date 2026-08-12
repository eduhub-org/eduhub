import { describe, expect, it } from '@jest/globals';
import { validateFileUpload } from './fileValidation.js';

const PDF = Buffer.from('%PDF-1.7\n');
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
const zipWithMarker = (marker) => Buffer.concat([ZIP, Buffer.from(marker)]);
const DOC = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.from('WordDocument', 'utf16le'),
]);
const PPT = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.from('PowerPoint Document', 'utf16le'),
]);
const DOCX = zipWithMarker('[Content_Types].xml word/document.xml');
const PPTX = zipWithMarker('[Content_Types].xml ppt/presentation.xml');
const ODT = zipWithMarker('application/vnd.oasis.opendocument.text');
const ODP = zipWithMarker('application/vnd.oasis.opendocument.presentation');

describe('validateFileUpload', () => {
  it.each([
    ['submission.pdf', PDF],
    ['submission.DOC', DOC],
    ['submission.docx', DOCX],
    ['submission.odt', ODT],
    ['submission.zip', ZIP],
  ])('accepts documentation extension and signature for %s', (fileName, buffer) => {
    expect(validateFileUpload(fileName, buffer, '.pdf,.doc,.docx,.odt,.zip')).toBe(true);
  });

  it.each([
    ['slides.pdf', PDF],
    ['slides.ppt', PPT],
    ['slides.pptx', PPTX],
    ['slides.odp', ODP],
  ])('accepts presentation extension and signature for %s', (fileName, buffer) => {
    expect(validateFileUpload(fileName, buffer, '.pdf,.ppt,.pptx,.odp')).toBe(true);
  });

  it('rejects an extension outside the action allowlist', () => {
    expect(validateFileUpload('payload.exe', PDF, '.pdf,.doc,.docx,.odt,.zip')).toBe(false);
    expect(validateFileUpload('submission.zip', ZIP, '.pdf,.ppt,.pptx,.odp')).toBe(false);
  });

  it('rejects content whose signature does not match its extension', () => {
    expect(validateFileUpload('payload.pdf', ZIP, '.pdf')).toBe(false);
    expect(validateFileUpload('payload.zip', PDF, '.zip')).toBe(false);
    expect(validateFileUpload('payload.docx', ZIP, '.docx')).toBe(false);
    expect(validateFileUpload('payload.ppt', DOC, '.ppt')).toBe(false);
  });
});
