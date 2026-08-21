import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { replacePlaceholders } from "../lib/utils.js";
import { sanitizeStoredFileName } from "../lib/fileName.js";
import { logger } from "../index.js";
import sharp from "sharp";
import path from "path";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 5;
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff'];

/**
 * Resizes an image to a specified width and converts it to WebP format.
 * 
 * @param {string} base64Image - The base64 encoded string of the image.
 * @param {number} size - The width to resize the image to.
 * @returns {Promise<string>} A promise that resolves to the resized image as a base64 encoded string.
 */
function resizeImage(base64Image, size) {
    return sharp(Buffer.from(base64Image, 'base64'))
      .resize({ width: size })
      .webp() // Convert to WebP format
      .toBuffer()
      .then(resizedBuffer => resizedBuffer.toString('base64'))
      .catch(err => { throw err; });
}
  
/**
 * Generates a filename for the resized image.
 * 
 * @param {string} originalFilePath - The original file path of the image.
 * @param {number} size - The width the image is resized to.
 * @returns {string} The filename for the resized image.
 */
function generateResizedFilename(originalFilePath, size) {
    return originalFilePath.replace(/\.[^.]+$/, `-${size}.webp`); // Change extension to .webp
}

/**
 * Extracts the image format from a base64 encoded string.
 * 
 * @param {string} base64Image - The base64 encoded string of the image.
 * @returns {string|null} The extracted image format, or null if not found.
 */
function extractFormatFromFileName(filename) {
  let extension = path.extname(filename);
  extension = extension.startsWith('.') ? extension.substring(1) : extension;
  logger.debug(`File extension: ${extension}`);
  return extension;
}

/**
 * Saves an image to cloud storage, optionally creating resized versions.
 *
 * @param {Object} req Request object containing:
 *   - input.base64file (string): Base64 encoded image content
 *   - input.filename (string): Original filename with extension
 *   - headers.file-path (string): Template path for file storage
 *   - headers.bucket (string): Storage bucket name
 *   - headers.is-public (boolean, optional): Whether file should be public
 *   - headers.max-file-size-mb (number, optional): Maximum file size in MB
 *   - headers.sizes (string, optional): JSON array of resize widths
 * @returns {Object} Response containing:
 *   - success (boolean): Whether the operation was successful
 *   - messageKey (string): Translation key for messages
 *   - error (string, optional): Error message if operation failed
 *   - filePath (string): Path to the original image in storage
 *   - accessUrl (string): URL to access the original image (signed URL if private, public URL if public)
 *   - resizedPaths (Object[], optional): Array of objects containing:
 *     - size (number): Width the image was resized to
 *     - filePath (string): Path to the resized image
 *     - accessUrl (string): URL to access the resized image (signed URL if private, public URL if public)
 */
const saveImage = async (req) => {
  logger.info("########## Save Image ##########");
  logger.debug("Request parameters", {
    filename: req.body.input.filename,
    templatePath: req.headers['file-path'],
    bucket: req.headers.bucket,
    isPublic: req.headers['is-public'],
    maxFileSize: req.headers['max-file-size-mb'],
    sizes: req.headers.sizes
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

    // Validate image format
    // Normalised before use: the name reaches the storage object key through
    // replacePlaceholders below.
    const safeFileName = sanitizeStoredFileName(req.body.input.filename);
    const format = extractFormatFromFileName(safeFileName);
    if (!format || !SUPPORTED_FORMATS.includes(format.toLowerCase())) {
      logger.error("Unsupported image format", { format });
      return {
        success: false,
        messageKey: "INVALID_FORMAT",
        error: "Unsupported image format"
      };
    }

    const storage = buildCloudStorage(Storage);
    const contentBuffer = Buffer.from(req.body.input.base64file, 'base64');
    const templatePath = req.headers["file-path"];
    const sizes = JSON.parse(req.headers["sizes"] || "[]");
    const isPublic = req.headers['is-public'] ?? false;
    const maxFileSizeInMB = req.headers['max-file-size-mb'] ?? DEFAULT_MAX_FILE_SIZE_MB;

    // Validate file size
    const fileSizeInMB = contentBuffer.length / BYTES_PER_MB;
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

    const { base64file: _base64file, ...pathInputs } = req.body.input;
    const filePath = replacePlaceholders(templatePath, {
      ...pathInputs,
      filename: safeFileName,
    });
    const accessUrl = await storage.saveToBucket(filePath, req.headers.bucket, contentBuffer.toString('base64'), isPublic);
    logger.debug(`Original image saved successfully: ${filePath}, public: ${isPublic}`);

    // Handle resized versions if sizes are specified
    const resizedPaths = [];
    if (sizes.length > 0) {
      const resizeOperations = sizes.map(async size => {
        const resizedFilePath = generateResizedFilename(filePath, size);
        const resizedBuffer = await resizeImage(contentBuffer, size);
        const resizedUrl = await storage.saveToBucket(
          resizedFilePath, 
          req.headers.bucket, 
          resizedBuffer.toString('base64'), 
          isPublic
        );
        resizedPaths.push({ size, filePath: resizedFilePath, accessUrl: resizedUrl });
      });

      await Promise.all(resizeOperations);
    }

    logger.info("Image saved successfully", { filePath, resizedCount: resizedPaths.length });
    return {
      success: true,
      messageKey: "IMAGE_SAVE_SUCCESS",
      filePath,
      accessUrl,
      ...(resizedPaths.length > 0 && { resizedPaths })
    };

  } catch (error) {
    logger.error("Error saving image", { 
      error: error.message, 
      stack: error.stack 
    });
    return {
      success: false,
      messageKey: "IMAGE_SAVE_ERROR",
      error: "An error occurred while saving the image"
    };
  }
};

export default saveImage;
