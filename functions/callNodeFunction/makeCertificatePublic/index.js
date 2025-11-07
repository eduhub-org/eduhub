import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { logger } from "../index.js";

/**
 * Makes a certificate file public in cloud storage and returns the public URL.
 *
 * @param {Object} req Request object containing:
 *   - input.certificatePath (string): Path to the certificate file in storage
 *   - session_variables['x-hasura-role'] (string): User role
 *   - session_variables['x-hasura-user-id'] (string): User UUID
 * @returns {Object} Response containing:
 *   - success (boolean): Whether the operation was successful
 *   - messageKey (string): Translation key for messages
 *   - error (string, optional): Error message if operation failed
 *   - publicUrl (string, optional): The public URL if successful
 */
const makeCertificatePublic = async (req) => {
  logger.info("########## Make Certificate Public ##########");
  logger.debug("Request parameters", { 
    certificatePath: req.body.input.certificatePath,
    role: req.body.session_variables['x-hasura-role'],
    userId: req.body.session_variables['x-hasura-user-id']
  });

  const storage = buildCloudStorage(Storage);
  const certificatePath = req.body.input.certificatePath;
  const userRole = req.body.session_variables['x-hasura-role'];
  const userUUID = req.body.session_variables['x-hasura-user-id'];

  try {
    // Validate input
    if (!certificatePath) {
      logger.warn("Missing certificate path");
      return {
        success: false,
        messageKey: "MISSING_CERTIFICATE_PATH",
        error: "Certificate path is required."
      };
    }

    // Validate user has permission (user can only make their own certificates public)
    const hasPermission = 
      userRole === 'admin' ||
      userRole === 'instructor' ||
      (userUUID && certificatePath.includes("/user-" + userUUID + "/")) ||
      (userUUID && certificatePath.startsWith(userUUID + "/")) || // included for legacy names
      (userUUID && certificatePath.startsWith("/user-" + userUUID + "/")); // included for legacy names

    if (!hasPermission) {
      logger.warn("Access denied for making certificate public", { certificatePath, userRole, userUUID });
      return {
        success: false,
        messageKey: "CERTIFICATE_ACCESS_DENIED",
        error: "You do not have permission to make this certificate public."
      };
    }

    // Make the certificate public and get public URL
    const bucketName = req.headers.bucket;
    
    if (process.env.ENVIRONMENT === "development") {
      // In development/emulated mode, just return a mock public URL
      logger.debug(`[Emulated] Making certificate public: ${bucketName}/${certificatePath}`);
      const publicUrl = `http://localhost:${process.env.STORAGE_PORT}/${bucketName}/${certificatePath}`;
      return {
        success: true,
        messageKey: "CERTIFICATE_MADE_PUBLIC",
        publicUrl
      };
    } else {
      // In production, use actual Storage API
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(certificatePath);
      
      // Check if file already is public
      const [isPublic] = await file.isPublic();
      
      if (!isPublic) {
        await file.makePublic();
        logger.info("Certificate made public", { certificatePath, userRole, userUUID });
      } else {
        logger.debug("Certificate already public", { certificatePath });
      }
      
      const publicUrl = await file.publicUrl();
      
      return {
        success: true,
        messageKey: "CERTIFICATE_MADE_PUBLIC",
        publicUrl
      };
    }
  } catch (error) {
    logger.error("Error making certificate public", { 
      error: error.message, 
      certificatePath, 
      userRole, 
      userUUID, 
      stack: error.stack 
    });
    return {
      success: false,
      messageKey: "CERTIFICATE_PUBLIC_ERROR",
      error: "An error occurred while making the certificate public."
    };
  }
};

export default makeCertificatePublic;

