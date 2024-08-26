import { request, gql } from "graphql-request";
import logger from "../index.js";
import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import path from "path";
import axios from "axios";
import fs from 'fs';

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
        motivationLetter
      }
    }
  }
`;

const UPDATE_MOTIVATION_LETTERS = gql`
  mutation UpdateMotivationLetters($updates: [CourseEnrollment_updates!]!) {
    update_CourseEnrollment_many(updates: $updates) {
      affected_rows
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
  let status = 200;
  const result = {
    anonymizedUserId: null,
    messageKey: "",
    error: null,
    steps: {
      keycloak_deletion: false,
      user_data_anonymization: false,
      profile_picture_removal: false,
      certificate_anonymization: false
    }
  };

  try {
    if (!req.body.input || !req.body.input.userId) {
      logger.error("Missing required field: userId");
      status = 400;
      result.error = "ERROR_MISSING_USER_ID";
      result.messageKey = "ANONYMIZATION_FAILED_MISSING_USER_ID";
      return { status, result };
    }

    const userId = req.body.input.userId;
    result.anonymizedUserId = userId;
    logger.debug(`Received anonymizeUser request for userId: ${userId}`);

    // Delete user from Keycloak
    try {
      const keycloakToken = await getKeycloakToken();
      result.steps.keycloak_deletion = await deleteKeycloakUser(userId, keycloakToken);
    } catch (keycloakError) {
      logger.error(`Error in Keycloak operations: ${keycloakError.message}`);
      // We continue the process even if Keycloak deletion fails
    }

    let userData;
    try {
      userData = await request(
        process.env.HASURA_ENDPOINT,
        GET_USER_AND_ENROLLMENTS,
        { userId },
        { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET }
      );
    } catch (error) {
      logger.error(`Error fetching user data: ${error.message}`);
      
      if (error.message.includes("invalid input syntax for type uuid")) {
        status = 400;
        result.error = "ERROR_INVALID_UUID";
        result.messageKey = "ANONYMIZATION_FAILED_INVALID_UUID";
        result.message = `Invalid UUID format: ${userId}`;
      } else {
        status = 500;
        result.error = "ERROR_FETCHING_USER_DATA";
        result.messageKey = "ANONYMIZATION_FAILED_FETCHING_USER_DATA";
        result.message = `Error fetching user data: ${error.message}`;
      }
      
      return { status, result };
    }
    
    if (!userData.User_by_pk) {
      logger.error(`User not found: ${userId}`);
      status = 404;
      result.error = "ERROR_USER_NOT_FOUND";
      result.messageKey = "ANONYMIZATION_FAILED_USER_NOT_FOUND";
      result.message = `User not found with ID: ${userId}`;
      return { status, result };
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
        result.steps.profile_picture_removal = true;
      } catch (pictureError) {
        logger.error(`Error removing profile picture: ${pictureError.message}`);
      }
    } else {
      result.steps.profile_picture_removal = true; // No picture to remove
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
      result.steps.user_data_anonymization = true;
    } catch (updateError) {
      logger.error(`Error updating user data: ${updateError.message}`);
    }

    // Anonymize motivation letters in all enrollments
    const enrollmentsToUpdate = user.CourseEnrollments.map(enrollment => ({
      where: { id: { _eq: enrollment.id } },
      _set: {
        motivationLetter: enrollment.motivationLetter 
          ? "This motivation letter has been anonymized due to user request." 
          : null
      }
    }));

    try {
      await request(
        process.env.HASURA_ENDPOINT,
        UPDATE_MOTIVATION_LETTERS,
        { updates: enrollmentsToUpdate },  // Changed from 'enrollments' to 'updates'
        { "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET }
      );
      logger.debug(`Anonymized motivation letters for userId: ${userId}`);
      result.steps.motivation_letter_anonymization = true;
    } catch (motivationLetterError) {
      logger.error(`Error anonymizing motivation letters: ${motivationLetterError.message}`);
      result.steps.motivation_letter_anonymization = false;
    }

    // Handle certificates
    let allCertificatesAnonymized = true;
    const currentWorkingDir = process.cwd();
    const defaultCertificatePath = path.join(currentWorkingDir, 'anonymizeUser','default_deleted_certificate.pdf');
    const pdfBufferDefaultCertificate = fs.readFileSync(defaultCertificatePath);
    for (const enrollment of user.CourseEnrollments) {
      try {
        if (enrollment.achievementCertificateURL) {
          await storage.saveToBucket(enrollment.achievementCertificateURL, bucketName, pdfBufferDefaultCertificate);
          logger.debug(`Replaced achievement certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
        }
        if (enrollment.attendanceCertificateURL) {
          await storage.saveToBucket(enrollment.attendanceCertificateURL, bucketName, pdfBufferDefaultCertificate);
          logger.debug(`Replaced attendance certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
        }
      } catch (certError) {
        logger.error(`Error anonymizing certificates for courseId ${enrollment.courseId}: ${certError.message}`);
        allCertificatesAnonymized = false;
      }
    }
    
    result.steps.certificate_anonymization = allCertificatesAnonymized;
  
    logger.debug(`Anonymization process completed for userId: ${userId}`);

    const allStepsSuccessful = Object.values(result.steps).every(Boolean);
    
    if (allStepsSuccessful) {
      status = 200;
      result.messageKey = "ANONYMIZATION_SUCCESS";
    } else {
      status = 206; // Partial Content if some operations failed
      result.messageKey = "ANONYMIZATION_PARTIAL_SUCCESS";
      result.error = "ERROR_SOME_STEPS_FAILED";
    }

    logger.info(`Anonymization result: ${JSON.stringify(result, null, 2)}`);

    return { status, result };

  } catch (error) {
    logger.error("Error anonymizing user", { error: error.message, stack: error.stack });
    status = 500;
    result.error = "ERROR_GENERAL";
    result.messageKey = "ANONYMIZATION_FAILED_GENERAL_ERROR";
    logger.info(`Anonymization result (with error): ${JSON.stringify(result, null, 2)}`);
    return { status, result };
  }
};


export default anonymizeUser;
