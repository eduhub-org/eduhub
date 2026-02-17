import { gql, GraphQLClient } from 'graphql-request';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

/**
 * Sends an email when a user is added as an organizer (instructor) to a course or event.
 * Uses "organizer" terminology to cover both courses and events.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendOrganizerAddedEmail(req, logger) {
  logger.info('########## Send Organizer Added Email ##########');
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { event } = req.body;
    const { op, data } = event;

    if (op !== 'INSERT') {
      return {
        success: true,
        messageKey: 'NO_ACTION_NEEDED',
        message: 'No action needed for this operation',
      };
    }

    const courseInstructor = data.new;

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const GET_ORGANIZER_DETAILS = gql`
      query GetOrganizerDetails($courseInstructorId: Int!) {
        CourseInstructor_by_pk(id: $courseInstructorId) {
          id
          courseId
          userId
          User {
            id
            firstName
            lastName
            email
          }
          Course {
            id
            title
            Program {
              title
              shortTitle
              type
            }
          }
        }
      }
    `;

    const result = await client.request(GET_ORGANIZER_DETAILS, {
      courseInstructorId: courseInstructor.id,
    });

    const details = result?.CourseInstructor_by_pk;
    if (!details) {
      logger.error(`CourseInstructor not found: ${courseInstructor.id}`);
      return {
        success: false,
        error: 'CourseInstructor not found',
        messageKey: 'COURSE_INSTRUCTOR_NOT_FOUND',
      };
    }

    const { User, Course } = details;
    if (!User?.email) {
      logger.error(`Organizer has no email: userId=${details.userId}`);
      return {
        success: false,
        error: 'Organizer has no email address',
        messageKey: 'ORGANIZER_NO_EMAIL',
      };
    }

    const courseLink = `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${Course.id}`;

    const formatDate = () => '';
    const variableReplacer = createVariableReplacer(
      {
        user: User,
        course: Course,
        enrollment: {},
        courseLink,
      },
      formatDate
    );

    const emailResult = await queueEmail({
      templateType: 'ORGANIZER_ADDED',
      variableReplacer,
      recipientEmail: User.email,
      courseId: Course.id,
      client,
      logger,
    });

    if (!emailResult.success) {
      logger.error(`Failed to queue organizer added email: ${emailResult.error}`);
      return {
        success: false,
        error: emailResult.error,
        messageKey: emailResult.messageKey || 'EMAIL_QUEUE_FAILED',
      };
    }

    logger.info(
      `Email queued for organizer ${User.email}, courseId=${Course.id}, mailId=${emailResult.mailId}`
    );

    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: emailResult.mailId,
      courseInstructorId: courseInstructor.id,
    };
  } catch (error) {
    logger.error(`Error processing organizer added email: ${error.message}`, {
      error,
    });
    return {
      success: false,
      error: error.message,
      messageKey: 'EMAIL_PROCESSING_FAILED',
    };
  }
}
