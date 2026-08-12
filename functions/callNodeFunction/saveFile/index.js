import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { replacePlaceholders } from "../lib/utils.js";
import { logger } from "../index.js";
import { validateFileUpload } from "./fileValidation.js";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 20;

/**
 * Saves a base64 encoded file to cloud storage.
 *
 * @param {Object} req Request object containing:
 *   - input.base64file (string): Base64 encoded file content
 *   - headers.file-path (string): Template path for file storage
 *   - headers.bucket (string): Storage bucket name
 *   - headers.is-public (boolean, optional): Whether file should be public
 *   - headers.max-file-size-mb (number, optional): Maximum file size in MB
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
        error: "Missing required fields: base64file, file-path, or bucket"
      };
    }

    const storage = buildCloudStorage(Storage);
    const content = req.body.input.base64file;
    const templatePath = req.headers['file-path'];
    const isPublic = req.headers['is-public'] ?? false;
    const maxFileSizeInMB = req.headers['max-file-size-mb'] ?? DEFAULT_MAX_FILE_SIZE_MB;
    const allowedFileExtensions = req.headers['allowed-file-extensions'];
    const fileBuffer = Buffer.from(content, 'base64');

    // Validate file size
    const fileSizeInBytes = fileBuffer.length;
    const fileSizeInMB = fileSizeInBytes / BYTES_PER_MB;
    if (fileSizeInMB > maxFileSizeInMB) {
      logger.error("File size exceeds maximum size", { 
        fileSize: fileSizeInMB, 
        maxFileSize: maxFileSizeInMB 
      });
      return {
        success: false,
        messageKey: "FILE_TOO_LARGE",
        error: `File size exceeds maximum size of ${maxFileSizeInMB} MB`
      };
    }

    // Actions that provide an allowlist require both an accepted filename
    // extension and a matching file signature before anything reaches storage.
    if (
      allowedFileExtensions &&
      !validateFileUpload(req.body.input.filename ?? '', fileBuffer, allowedFileExtensions)
    ) {
      logger.error("File extension or signature is not allowed", {
        fileName: req.body.input.filename,
        allowedFileExtensions,
      });
      return {
        success: false,
        messageKey: "INVALID_FORMAT",
        error: "File extension or content does not match an allowed format"
      };
    }

    const filePath = replacePlaceholders(templatePath, req.body.input);
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
      error: "An error occurred while saving the file"
    };
  }
};

export default saveFile;
