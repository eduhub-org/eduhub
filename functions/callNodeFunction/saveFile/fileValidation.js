const SIGNATURE_FAMILY_BY_EXTENSION = {
  '.pdf': 'pdf',
  '.doc': 'doc',
  '.docx': 'docx',
  '.odt': 'odt',
  '.zip': 'zip',
  '.ppt': 'ppt',
  '.pptx': 'pptx',
  '.odp': 'odp',
};

const startsWith = (buffer, signature) =>
  signature.every((byte, index) => buffer[index] === byte);

export const detectSignatureFamily = (buffer) => {
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  if (startsWith(buffer, [0x7b, 0x5c, 0x72, 0x74, 0x66])) return 'doc';

  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    if (buffer.includes(Buffer.from('WordDocument', 'utf16le'))) return 'doc';
    if (buffer.includes(Buffer.from('PowerPoint Document', 'utf16le'))) return 'ppt';
    return null;
  }

  const isZip =
    startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buffer, [0x50, 0x4b, 0x07, 0x08]);
  if (!isZip) return null;

  if (
    buffer.includes(Buffer.from('[Content_Types].xml')) &&
    buffer.includes(Buffer.from('word/'))
  ) {
    return 'docx';
  }
  if (
    buffer.includes(Buffer.from('[Content_Types].xml')) &&
    buffer.includes(Buffer.from('ppt/'))
  ) {
    return 'pptx';
  }
  if (buffer.includes(Buffer.from('application/vnd.oasis.opendocument.text'))) return 'odt';
  if (buffer.includes(Buffer.from('application/vnd.oasis.opendocument.presentation'))) return 'odp';
  return 'zip';
};

export const validateFileUpload = (fileName, buffer, allowedExtensions) => {
  const normalizedAllowedExtensions = allowedExtensions
    .split(',')
    .map((extension) => extension.trim().toLowerCase())
    .filter(Boolean);
  const extensionIndex = fileName.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex).toLowerCase() : '';

  if (!normalizedAllowedExtensions.includes(extension)) return false;

  return detectSignatureFamily(buffer) === SIGNATURE_FAMILY_BY_EXTENSION[extension];
};
