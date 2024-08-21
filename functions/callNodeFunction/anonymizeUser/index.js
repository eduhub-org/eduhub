import { request, gql } from "graphql-request";
import logger from "../index.js";
import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import path from "path";

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

const removeProfileImage = async (storage, bucketName, imagePath) => {
  if (!imagePath) return;

  const bucket = storage.bucket(bucketName);
  
  // Remove the original image
  await bucket.file(imagePath).delete().catch(err => {
    logger.warn(`Failed to delete original image at ${imagePath}: ${err.message}`);
  });

  // Remove any resized versions
  const directory = path.dirname(imagePath);
  const filename = path.basename(imagePath, path.extname(imagePath));
  const [files] = await bucket.getFiles({ prefix: directory });

  for (const file of files) {
    const resizedFilename = file.name;
    if (resizedFilename.startsWith(`${directory}/${filename}-`) && resizedFilename.endsWith('.webp')) {
      await bucket.file(resizedFilename).delete().catch(err => {
        logger.warn(`Failed to delete resized image at ${resizedFilename}: ${err.message}`);
      });
    }
  }
};

const generateAnonymousFile = () => {
  return Buffer.from('This certificate has been deleted due to user anonymization.', 'utf-8');
};

const anonymizeUser = async (req, res) => {
  try {
    if (!req.body.input || !req.body.input.userId) {
      return res.status(400).json({ message: "Missing required field: userId" });
    }

    const userId = req.body.input.userId;
    logger.debug(`Received anonymizeUser request for userId: ${userId}`);

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
    const bucketName = process.env.BUCKET_NAME;

    // Remove profile picture
    if (user.picture) {
      await removeProfileImage(storage, bucketName, user.picture);
      logger.debug(`Removed profile picture for userId: ${userId}`);
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
        await storage.bucket(bucketName).file(enrollment.achievementCertificateURL).save(anonymousFileContent);
        logger.debug(`Replaced achievement certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
      }
      if (enrollment.attendanceCertificateURL) {
        await storage.bucket(bucketName).file(enrollment.attendanceCertificateURL).save(anonymousFileContent);
        logger.debug(`Replaced attendance certificate for userId: ${userId}, courseId: ${enrollment.courseId}`);
      }
    }

    logger.debug(`Anonymized data saved for userId: ${userId}`);

    return res.json({ message: "User data anonymized successfully" });

  } catch (error) {
    logger.error("Error anonymizing user", { error: error.message, stack: error.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default anonymizeUser;