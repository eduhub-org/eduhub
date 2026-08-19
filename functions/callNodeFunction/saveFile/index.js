import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { replacePlaceholders } from "../lib/utils.js";
import { logger } from "../index.js";
import { maxBase64LengthForBytes, validateFileUpload } from "./fileValidation.js";
import { sanitizeStoredFileName } from "../lib/fileName.js";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 20;

// saveFileResult declares filePath/accessUrl as String! (actions.graphql), so every
// return - including failures - must carry them. Omitting them makes Hasura reject
// the whole response with "expecting not null value for field filePath" and the real
// messageKey never reaches the client. Callers branch on `success` first, so the
// empty strings below are never read.
const FAILURE_FILE_FIELDS = { filePath: "", accessUrl: "" };

/**
 * Saves a base64 encoded file to cloud storage.
 *
 * @param {Object} req Request object containing:
 *   - input.base64file (string): Base64 encoded file content
 *   - headers.file-path (string): Template path for file storage
 *   - headers.bucket (string): Storage bucket name
 *   - headers.is-public (boolean, optional): Whether file should be public
 *   - headers.max-file-size-mb (number, optional): Maximum file size in MB
 *   - headers.max-file-size-bytes (number, optional): Exact maximum size in bytes
 *   - headers.allowed-file-extensions (string, optional): Comma-separated extension allowlist
 * @returns {Object} Response containing:
 *   - success (boolean): Whether the operation was successful
 *   - messageKey (string): Translation key for messages
 *   - error (string, optional): Error message if operation failed
 *   - filePath (string): Path to the file in the storage bucket
 *   - accessUrl (string): URL to access the file (signed URL if private, public URL if public)
 */
const saveFile = async (req) => {
  logger.info("########## Save File ##########");
  logger.debug("Request parameters", {
    templatePath: req.headers['file-path'],
    bucket: req.headers.bucket,
    isPublic: req.headers['is-public'],
    maxFileSize: req.headers['max-file-size-mb']
  });

  try {
    // Validate required fields
    if (!req.body.input.base64file || !req.headers['file-path'] || !req.headers.bucket) {
      logger.error("Missing required fields");
      return {
        success: false,
        messageKey: "INVALID_INPUT",
        error: "Missing required fields: base64file, file-path, or bucket",
        ...FAILURE_FILE_FIELDS,
      };
    }

    const content = req.body.input.base64file;
    const templatePath = req.headers['file-path'];
    const isPublic = req.headers['is-public'] ?? false;
    const maxFileSizeInMB = req.headers['max-file-size-mb'] ?? DEFAULT_MAX_FILE_SIZE_MB;
    const maxFileSizeInBytes = Number(
      req.headers['max-file-size-bytes'] ?? maxFileSizeInMB * BYTES_PER_MB
    );
    const allowedFileExtensions = req.headers['allowed-file-extensions'];
    const maxBase64Length = maxBase64LengthForBytes(maxFileSizeInBytes);

    // Reject encoded payloads that cannot fit before allocating a decoded copy.
    if (content.length > maxBase64Length) {
      logger.error("Encoded file size exceeds maximum size", {
        encodedSize: content.length,
        maxFileSize: maxFileSizeInBytes,
      });
      return {
        success: false,
        messageKey: "FILE_TOO_LARGE",
        error: `File size exceeds maximum size of ${maxFileSizeInBytes} bytes`,
        ...FAILURE_FILE_FIELDS,
      };
    }

    const fileBuffer = Buffer.from(content, 'base64');

    // Validate file size
    const fileSizeInBytes = fileBuffer.length;
    if (fileSizeInBytes > maxFileSizeInBytes) {
      logger.error("File size exceeds maximum size", { 
        fileSize: fileSizeInBytes,
        maxFileSize: maxFileSizeInBytes,
      });
      return {
        success: false,
        messageKey: "FILE_TOO_LARGE",
        error: `File size exceeds maximum size of ${maxFileSizeInBytes} bytes`,
        ...FAILURE_FILE_FIELDS,
      };
    }

    // Actions that provide an allowlist require both an accepted filename
    // extension and a matching file signature before anything reaches storage.
    // The client-supplied name ends up in the storage object key via
    // replacePlaceholders, so normalise it before it is validated or stored.
    const safeFileName = sanitizeStoredFileName(req.body.input.filename);

    if (
      allowedFileExtensions &&
      !validateFileUpload(safeFileName, fileBuffer, allowedFileExtensions)
    ) {
      logger.error("File extension or signature is not allowed", {
        fileName: req.body.input.filename,
        allowedFileExtensions,
      });
      return {
        success: false,
        messageKey: "INVALID_FORMAT",
        error: "File extension or content does not match an allowed format",
        ...FAILURE_FILE_FIELDS,
      };
    }

    // base64file is excluded deliberately: it never appears in a path template and
    // feeding a multi-MB string through RegExp replacement is pure waste (and its
    // contents could otherwise act as a replacement pattern).
    const { base64file: _base64file, ...pathInputs } = req.body.input;
    const filePath = replacePlaceholders(templatePath, {
      ...pathInputs,
      filename: safeFileName,
    });
    const storage = buildCloudStorage(Storage);
    const accessUrl = await storage.saveToBucket(filePath, req.headers.bucket, content, isPublic);
    
    logger.info("File saved successfully", { filePath, isPublic });
    return {
      success: true,
      messageKey: "FILE_SAVE_SUCCESS",
      filePath,
      accessUrl
    };

  } catch (error) {
    logger.error("Error saving file", { 
      error: error.message, 
      stack: error.stack 
    });
    return {
      success: false,
      messageKey: "FILE_SAVE_ERROR",
      error: "An error occurred while saving the file",
      ...FAILURE_FILE_FIELDS,
    };
  }
};

export default saveFile;
