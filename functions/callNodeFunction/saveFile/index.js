import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { replacePlaceholders } from "../lib/utils.js";
import logger from "../index.js";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 20;

/**
 * Responds to any HTTP request to save a file.
 * Validates the request, calculates the file size, and saves the file to Google Cloud Storage.
 *
 * @param {!express:Request} req HTTP request context. Expects base64 encoded file content,
 * a file path template in headers, and other optional parameters like file size limit.
 * @param {!express:Response} res HTTP response context. Returns the file path and Google Cloud link of the saved file.
 */
const saveFile = async (req, res) => {
  try{
    // Validate required fields
    if (!req.body.input.base64file || !req.headers['file-path'] || !req.headers.bucket) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const storage = buildCloudStorage(Storage);
    const content = req.body.input.base64file;
    const templatePath = req.headers["file-path"];
    const isPublic = req.headers['is-public'] ?? false;
    const maxFileSizeInMB = req.body.input.maxFileSize ?? DEFAULT_MAX_FILE_SIZE_MB;
    logger.debug(`Received saveFile request with isPublic: ${isPublic}, maxFileSize: ${maxFileSizeInMB}`);

    const fileSizeInBytes = Buffer.byteLength(content, 'base64');
    const fileSizeInMB = fileSizeInBytes / BYTES_PER_MB;
    logger.debug(`File size in MB: ${fileSizeInMB}`);

    if (fileSizeInMB > maxFileSizeInMB) {
      logger.error("File size exceeds maximum size", { fileSize: content.length, maxFileSize });
      return res.status(400).json({
        error: "File size exceeds maximum size",
      });
    }
    
    const filePath = replacePlaceholders(templatePath, req.body.input);
    logger.debug(`File path after replacing placeholders: ${filePath}`);

    const link = await storage.saveToBucket(filePath, req.headers.bucket, content, isPublic);
    logger.debug(`File saved successfully: ${filePath}, public: ${isPublic}`);

    return res.json({ filePath, google_link: link });

  } catch (error) {
    logger.error("Error saving file", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default saveFile;