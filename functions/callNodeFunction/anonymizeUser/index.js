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
  } catch (error) {
    logger.error(`Error deleting user from Keycloak: ${error.message}`);
    throw error;
  }
};

const anonymizeUser = async (req, res) => {
  try {
    if (!req.body.input || !req.body.input.userId) {
      return res.status(400).json({ message: "Missing required field: userId" });
    }

    const userId = req.body.input.userId;
    logger.debug(`Received anonymizeUser request for userId: ${userId}`);

    // Delete user from Keycloak
    try {
      const keycloakToken = await getKeycloakToken();
      await deleteKeycloakUser(userId, keycloakToken);
    } catch (keycloakError) {
      logger.error(`Error in Keycloak operations: ${keycloakError.message}`);
      // Continue with the process even if Keycloak deletion fails
    }

    const userData = await request(
      process.env.HASURA_ENDPOINT,
      GET_USER_AND_ENROLLMENTS,
      { userId },
      { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET }
    );

    if (!userData.User_by_pk) {
      logger.error(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData.User_by_pk;
    const anonymizedUser = anonymizeUserData(user);

    const storage = buildCloudStorage(Storage);
    const bucketName = req.headers.bucket;

    // Remove profile picture
    if (user.picture) {
      await removeProfileImage(storage, user.picture, bucketName);
      logger.debug(`Attempted to remove profile picture for userId: ${userId}`);
    }
  
    // Update user data
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

    // Generate anonymous file content
    const anonymousFileContent = generateAnonymousFile();

    // Handle certificates
    for (const enrollment of user.CourseEnrollments) {
      if (enrollment.achievementCertificateURL) {
        await storage.saveToBucket(enrollment.achievementCertificateURL, bucketName, anonymousFileContent);
        logger.debug(`Replaced achievement certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
      }
      if (enrollment.attendanceCertificateURL) {
        await storage.saveToBucket(enrollment.attendanceCertificateURL, bucketName, anonymousFileContent);
        logger.debug(`Replaced attendance certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
      }
    }
  
    logger.debug(`Anonymized data saved for userId: ${userId}`);

    return res.json({ message: "User data anonymized successfully and deleted from Keycloak" });

  } catch (error) {
    logger.error("Error anonymizing user", { error: error.message, stack: error.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default anonymizeUser;
