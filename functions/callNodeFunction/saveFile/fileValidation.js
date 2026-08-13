const FORMAT_BY_EXTENSION = {
  '.pdf': 'pdf',
  '.doc': 'compound',
  '.docx': 'zip',
  '.odt': 'zip',
  '.zip': 'zip',
  '.ppt': 'compound',
  '.pptx': 'zip',
  '.odp': 'zip',
};

const startsWith = (buffer, signature) =>
  buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);

export const maxBase64LengthForBytes = (maxBytes) => Math.ceil(maxBytes / 3) * 4;

const isPdf = (buffer) =>
  startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]) &&
  buffer.subarray(Math.max(0, buffer.length - 1024)).includes(Buffer.from('%%EOF'));

const isCompoundFile = (buffer) =>
  buffer.length >= 512 &&
  startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) &&
  buffer.readUInt16LE(28) === 0xfffe &&
  [9, 12].includes(buffer.readUInt16LE(30));

const isZip = (buffer) => {
  if (
    !startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) &&
    !startsWith(buffer, [0x50, 0x4b, 0x05, 0x06])
  ) {
    return false;
  }

  const minimumEndOffset = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimumEndOffset; offset--) {
    if (buffer.readUInt32LE(offset) !== 0x06054b50) continue;

    const commentLength = buffer.readUInt16LE(offset + 20);
    const centralSize = buffer.readUInt32LE(offset + 12);
    const centralOffset = buffer.readUInt32LE(offset + 16);
    const entryCount = buffer.readUInt16LE(offset + 10);
    const centralDirectoryIsPresent =
      entryCount === 0 ||
      (centralOffset + 4 <= offset && buffer.readUInt32LE(centralOffset) === 0x02014b50);

    return (
      buffer.readUInt16LE(offset + 4) === 0 &&
      buffer.readUInt16LE(offset + 6) === 0 &&
      offset + 22 + commentLength === buffer.length &&
      centralOffset + centralSize <= offset &&
      centralDirectoryIsPresent
    );
  }
  return false;
};

const detectFormat = (buffer) => {
  if (isPdf(buffer)) return 'pdf';
  if (isCompoundFile(buffer)) return 'compound';
  if (isZip(buffer)) return 'zip';
  return null;
};

export const validateFileUpload = (fileName, buffer, allowedExtensions) => {
  const allowed = allowedExtensions
    .split(',')
    .map((extension) => extension.trim().toLowerCase())
    .filter(Boolean);
  const extensionIndex = fileName.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex).toLowerCase() : '';

  return allowed.includes(extension) && detectFormat(buffer) === FORMAT_BY_EXTENSION[extension];
};
