import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { replacePlaceholders } from "../lib/utils.js";
import logger from "../index.js";
import sharp from "sharp";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 20;
const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff'];

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
function extractFormatFromBase64(base64Image) {
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,/);
    return matches && matches[1];
}

/**
 * Handles the HTTP request to save an image. Validates the request, saves the original image,
 * resizes the image to specified sizes, and saves the resized images.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @returns {Promise<Response>} A promise that resolves to the HTTP response.
 */
export const saveImage = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.input.base64file || !req.headers['file-path'] || !req.headers.bucket) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Validate image format
    const format = extractFormatFromBase64(req.body.input.base64file);
    if (!format || !SUPPORTED_FORMATS.includes(format.toLowerCase())) {
      return res.status(400).json({ error: "Unsupported image format" });
    }

    const storage = buildCloudStorage(Storage);
    const contentBuffer = Buffer.from(req.body.input.base64file, 'base64');
    const templatePath = req.headers["file-path"];
    const sizes = req.body.input.sizes || []
    const isPublic = req.headers['is-public'] ?? false;
    const maxFileSizeInMB = req.body.input.maxFileSize ?? DEFAULT_MAX_FILE_SIZE_MB;
    logger.debug(`Received saveImage request with isPublic: ${isPublic}, maxFileSize: ${maxFileSizeInMB}`);

    const fileSizeInMB = contentBuffer.length / BYTES_PER_MB;
    logger.debug(`File size in MB: ${fileSizeInMB}`);

    if (fileSizeInMB > maxFileSizeInMB) {
        logger.error("File size exceeds maximum size", { fileSize: content.length, maxFileSize });
        return res.status(400).json({ error: "File size exceeds maximum size" });
    }

    const originalFilePath = replacePlaceholders(templatePath, req.body.input);
    logger.debug(`File path after replacing placeholders: ${originalFilePath}`);

    const originalLink = await storage.saveToBucket(originalFilePath, req.headers.bucket, contentBuffer.toString('base64'), isPublic);
    logger.debug(`Original image saved successfully: ${originalFilePath}, public: ${isPublic}`);

    const resizeOperations = sizes.map(async size => {
      const resizedFilePath = generateResizedFilename(originalFilePath, size);
      const resizedBuffer = await resizeImage(contentBuffer, size);
      await storage.saveToBucket(resizedFilePath, req.headers.bucket, resizedBuffer.toString('base64'), isPublic);
      logger.debug(`Resized WebP image saved successfully: ${resizedFilePath}, public: ${isPublic}`);
    });

    await Promise.all(resizeOperations);
  
    return res.json({ filePath: originalFilePath, google_link: originalLink });

  } catch (error) {
    logger.error("Error saving image", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default saveImage;
