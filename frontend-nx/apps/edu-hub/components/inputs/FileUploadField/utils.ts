import {
  MdPictureAsPdf,
  MdDescription,
  MdTableChart,
  MdSlideshow,
  MdArchive,
  MdCode,
  MdTextSnippet,
  MdVideoFile,
  MdAudioFile,
  MdInsertDriveFile,
} from 'react-icons/md';
import { IconType } from 'react-icons';

export type FileTypeCategory =
  | 'image'
  | 'pdf'
  | 'document'
  | 'open_document_text'
  | 'open_document_presentation'
  | 'spreadsheet'
  | 'csv'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'text'
  | 'video'
  | 'audio'
  | 'unknown';

export interface FileIconInfo {
  Icon: IconType;
  color: string;
  labelKey: string; // Translation key for the label
}

/**
 * Detects the file type from a file URL/path.
 * @param fileUrl - The file URL or path
 * @returns File type category
 */
export const detectFileType = (fileUrl: string | null): FileTypeCategory => {
  if (!fileUrl) return 'unknown';

  const extension = fileUrl.split('.').pop()?.toLowerCase();

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';

  // PDF
  if (extension === 'pdf') return 'pdf';

  // Documents
  if (extension === 'odt') return 'open_document_text';
  if (['doc', 'docx'].includes(extension || '')) return 'document';

  // CSV files (generic spreadsheet format)
  if (extension === 'csv') return 'csv';

  // Excel spreadsheets
  if (['xls', 'xlsx'].includes(extension || '')) return 'spreadsheet';

  // Presentations
  if (extension === 'odp') return 'open_document_presentation';
  if (['ppt', 'pptx'].includes(extension || '')) return 'presentation';

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) return 'archive';

  // Code files
  if (['js', 'ts', 'py', 'html', 'css', 'json'].includes(extension || '')) return 'code';

  // Text files
  if (['txt', 'md'].includes(extension || '')) return 'text';

  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) return 'video';

  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) return 'audio';

  return 'unknown';
};

/**
 * Gets the appropriate icon and styling for a file type.
 * @param fileType - The file type category
 * @returns Icon component, color class, and label
 */
export const getFileIcon = (fileType: FileTypeCategory): FileIconInfo => {
  switch (fileType) {
    case 'pdf':
      return { Icon: MdPictureAsPdf, color: 'text-red-600', labelKey: 'file_upload.file_type.pdf' };
    case 'document':
      return { Icon: MdDescription, color: 'text-blue-600', labelKey: 'file_upload.file_type.word_document' };
    case 'open_document_text':
      return { Icon: MdDescription, color: 'text-blue-600', labelKey: 'file_upload.file_type.open_document_text' };
    case 'spreadsheet':
      return { Icon: MdTableChart, color: 'text-green-600', labelKey: 'file_upload.file_type.excel_spreadsheet' };
    case 'csv':
      return { Icon: MdTableChart, color: 'text-green-600', labelKey: 'file_upload.file_type.spreadsheet' };
    case 'presentation':
      return { Icon: MdSlideshow, color: 'text-orange-600', labelKey: 'file_upload.file_type.powerpoint' };
    case 'open_document_presentation':
      return { Icon: MdSlideshow, color: 'text-orange-600', labelKey: 'file_upload.file_type.open_document_presentation' };
    case 'archive':
      return { Icon: MdArchive, color: 'text-amber-600', labelKey: 'file_upload.file_type.archive' };
    case 'code':
      return { Icon: MdCode, color: 'text-purple-600', labelKey: 'file_upload.file_type.code_file' };
    case 'text':
      return { Icon: MdTextSnippet, color: 'text-gray-600', labelKey: 'file_upload.file_type.text_file' };
    case 'video':
      return { Icon: MdVideoFile, color: 'text-pink-600', labelKey: 'file_upload.file_type.video_file' };
    case 'audio':
      return { Icon: MdAudioFile, color: 'text-teal-600', labelKey: 'file_upload.file_type.audio_file' };
    case 'unknown':
    default:
      return { Icon: MdInsertDriveFile, color: 'text-gray-500', labelKey: 'file_upload.file_type.file' };
  }
};

/**
 * Extracts the filename from a file path/URL.
 * @param filePath - The file path or URL
 * @returns The filename or empty string
 */
export const getFilename = (filePath: string | null): string => {
  if (!filePath) return '';
  return filePath.split('/').pop() || '';
};

/**
 * Formats file size in bytes to human-readable format.
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats accepted file types string for display.
 * @param acceptedFileTypes - Accept attribute value (e.g., "image/*,.pdf" or "*")
 * @returns Formatted string (e.g., "JPG, PNG, PDF")
 */
export const formatAcceptedTypes = (acceptedFileTypes: string): string => {
  if (acceptedFileTypes === '*' || !acceptedFileTypes) {
    return 'All file types';
  }

  // Parse MIME types and extensions
  const types: string[] = [];
  const parts = acceptedFileTypes.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.startsWith('.')) {
      // Extension like .pdf
      types.push(part.substring(1).toUpperCase());
    } else if (part.includes('/')) {
      // MIME type like image/png or image/*
      const [category, subtype] = part.split('/');
      if (subtype === '*') {
        // Map common MIME categories to readable names
        switch (category) {
          case 'image':
            types.push('Images');
            break;
          case 'application':
            types.push('Documents');
            break;
          case 'video':
            types.push('Videos');
            break;
          case 'audio':
            types.push('Audio');
            break;
          default:
            types.push(category);
        }
      } else {
        // Specific MIME type
        const extension = subtype.toUpperCase();
        types.push(extension);
      }
    }
  }

  const unique = [...new Set(types)];
  return unique.length > 0 ? unique.join(', ') : 'All file types';
};

/**
 * Formats max file size for display.
 * @param maxFileSize - Maximum file size in bytes
 * @returns Formatted string (e.g., "5 MB")
 */
export const formatMaxSize = (maxFileSize?: number): string => {
  if (!maxFileSize) return '';
  return formatFileSize(maxFileSize);
};

const extensionToMime: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
};

const getExtension = (fileName: string): string => {
  const extensionIndex = fileName.lastIndexOf('.');
  return extensionIndex > -1 ? fileName.slice(extensionIndex).toLowerCase() : '';
};

const matchesMimeType = (fileType: string, acceptedType: string): boolean => {
  if (acceptedType === fileType) return true;
  if (!acceptedType.endsWith('/*')) return false;

  const acceptedCategory = acceptedType.split('/')[0];
  const fileCategory = fileType.split('/')[0];
  return acceptedCategory === fileCategory;
};

/**
 * Validates a file against the same extension and MIME rules used by an input's
 * `accept` attribute. Filename extensions are authoritative for extension-only
 * allowlists; MIME rules use the browser value with a filename-derived fallback.
 */
export const validateFileType = (
  fileName: string,
  fileType: string | undefined,
  acceptedFileTypes: string
): boolean => {
  if (acceptedFileTypes === '*' || !acceptedFileTypes) {
    return true;
  }

  const acceptedTypes = acceptedFileTypes
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
  const extension = getExtension(fileName);

  if (extension && acceptedTypes.includes(extension)) return true;

  const acceptedMimeTypes = acceptedTypes.filter((type) => type.includes('/'));
  if (acceptedMimeTypes.length === 0) return false;

  const candidateMimeTypes = [fileType?.toLowerCase(), extensionToMime[extension]]
    .filter((type): type is string => Boolean(type));

  return acceptedMimeTypes.some((acceptedType) =>
    candidateMimeTypes.some((candidateType) => matchesMimeType(candidateType, acceptedType))
  );
};
