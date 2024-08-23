import { request, gql } from "graphql-request";
import logger from "../index.js";
import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import path from "path";
import axios from "axios";

const shortenHashId = (hashId) => {
  return hashId.replace(/-/g, '').substr(0, 12);
};

const anonymizeUserData = (user) => {
  const shortHashId = shortenHashId(user.id);
  return {
    ...user,
    firstName: "ANON_USER",
    lastName: "ANON_USER",
    email: `anon_${shortHashId}@example.com`,
    matriculationNumber: user.matriculationNumber ? `ANON${shortHashId}` : null,
  };
};

const UPDATE_USER = gql`
  mutation UpdateUser(
    $userId: uuid!
    $firstName: String!
    $lastName: String!
    $email: String!
    $matriculationNumber: String
  ) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        firstName: $firstName
        lastName: $lastName
        email: $email
        externalProfile: null
        otherUniversity: null
        matriculationNumber: $matriculationNumber
        picture: null
      }
    ) {
      id
    }
  }
`;

const GET_USER_AND_ENROLLMENTS = gql`
  query GetUserAndEnrollments($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      email
      externalProfile
      university
      otherUniversity
      matriculationNumber
      picture
      CourseEnrollments {
        id
        courseId
        achievementCertificateURL
        attendanceCertificateURL
      }
    }
  }
`;

const removeProfileImage = async (storage, imagePath, bucketName) => {
  if (!imagePath) return;
  
  // Remove the original image
  await storage.deleteFile(imagePath, bucketName);
  logger.debug(`Attempted to remove profile picture at ${imagePath}`);

  // Remove any resized versions
  const directory = path.dirname(imagePath);
  const filename = path.basename(imagePath, path.extname(imagePath));
  const files = await storage.listFiles(bucketName, { prefix: directory });

  for (const file of files) {
    const resizedFilename = file.name;
    if (resizedFilename.startsWith(`${directory}/${filename}-`) && resizedFilename.endsWith('.webp')) {
      await storage.deleteFile(resizedFilename, bucketName);
      logger.debug(`Attempted to remove resized image at ${resizedFilename}`);
    }
  }
};

const generateAnonymousFile = () => {
  return Buffer.from('This certificate has been deleted due to user anonymization.', 'utf-8');
};

const getKeycloakToken = async () => {
  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: process.env.KEYCLOAK_USER || 'keycloak',
        password: process.env.KEYCLOAK_PW,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting Keycloak token', error);
    throw error;
  }
};

const deleteKeycloakUser = async (userId, token) => {
  try {
    await axios.delete(
      `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    logger.debug(`Deleted user from Keycloak: ${userId}`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logger.debug(`User not found in Keycloak: ${userId}. Considering this as a successful deletion.`);
      return true;
    }
    logger.error(`Error deleting user from Keycloak: ${error.message}`);
    throw error;
  }
};

const anonymizeUser = async (req, logger) => {
  const result = {
    keycloakDeletion: false,
    userDataAnonymization: false,
    profilePictureRemoval: false,
    certificateAnonymization: false,
    errors: []
  };

  try {
    if (!req.body.input || !req.body.input.userId) {
      logger.error("Missing required field: userId");
      result.errors.push("Missing required field: userId");
      return { status: 400, result };
    }

    const userId = req.body.input.userId;
    logger.debug(`Received anonymizeUser request for userId: ${userId}`);

    // Delete user from Keycloak
    try {
      const keycloakToken = await getKeycloakToken();
      result.keycloakDeletion = await deleteKeycloakUser(userId, keycloakToken);
    } catch (keycloakError) {
      logger.error(`Error in Keycloak operations: ${keycloakError.message}`);
      result.errors.push(`Keycloak deletion failed: ${keycloakError.message}`);
      // Don't throw here, continue with the process
    }

    const userData = await request(
      process.env.HASURA_ENDPOINT,
      GET_USER_AND_ENROLLMENTS,
      { userId },
      { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET }
    );

    if (!userData.User_by_pk) {
      logger.error(`User not found: ${userId}`);
      result.errors.push("User not found in database");
      return { 
        status: 404, 
        body: { 
          message: "User not found", 
          result 
        }
      };
    }

    const user = userData.User_by_pk;
    const anonymizedUser = anonymizeUserData(user);

    const storage = buildCloudStorage(Storage);
    const bucketName = req.headers.bucket;

    // Remove profile picture
    if (user.picture) {
      try {
        await removeProfileImage(storage, user.picture, bucketName);
        logger.debug(`Removed profile picture for userId: ${userId}`);
        result.profilePictureRemoval = true;
      } catch (pictureError) {
        logger.error(`Error removing profile picture: ${pictureError.message}`);
        result.errors.push(`Profile picture removal failed: ${pictureError.message}`);
      }
    } else {
      result.profilePictureRemoval = true; // No picture to remove
    }
  
    // Update user data
    try {
      await request(
        process.env.HASURA_ENDPOINT,
        UPDATE_USER,
        {
          userId: anonymizedUser.id,
          firstName: anonymizedUser.firstName,
          lastName: anonymizedUser.lastName,
          email: anonymizedUser.email,
          matriculationNumber: anonymizedUser.matriculationNumber,
        },
        { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET }
      );
      result.userDataAnonymization = true;
    } catch (updateError) {
      logger.error(`Error updating user data: ${updateError.message}`);
      result.errors.push(`User data update failed: ${updateError.message}`);
    }

    // Generate anonymous file content
    const anonymousFileContent = generateAnonymousFile();

    // Handle certificates
    let certificateErrors = [];
    for (const enrollment of user.CourseEnrollments) {
      try {
        if (enrollment.achievementCertificateURL) {
          await storage.saveToBucket(enrollment.achievementCertificateURL, bucketName, anonymousFileContent);
          logger.debug(`Replaced achievement certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
        }
        if (enrollment.attendanceCertificateURL) {
          await storage.saveToBucket(enrollment.attendanceCertificateURL, bucketName, anonymousFileContent);
          logger.debug(`Replaced attendance certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
        }
      } catch (certError) {
        certificateErrors.push(`Error anonymizing certificates for courseId ${enrollment.courseId}: ${certError.message}`);
      }
    }
    
    if (certificateErrors.length === 0) {
      result.certificateAnonymization = true;
    } else {
      result.errors.push(...certificateErrors);
    }
  
    logger.debug(`Anonymization process completed for userId: ${userId}`);
    logger.info("Anonymization result:", result);

    const success = Object.values(result).filter(v => typeof v === 'boolean').every(Boolean);
    const status = success ? 200 : 206; // 206 Partial Content if some operations failed

    return { status, result };

  } catch (error) {
    logger.error("Error anonymizing user", { error: error.message, stack: error.stack });
    result.errors.push(`General error: ${error.message}`);
    logger.info("Anonymization result (with error):", result);
    return { status: 500, result };
  }
};

export default anonymizeUser;