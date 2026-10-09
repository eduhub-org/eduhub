import { gql, GraphQLClient } from 'graphql-request';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

/**
 * Tells a person that they are listed as a speaker on a public course page.
 *
 * Organizers enter speakers themselves, so this is personal data we did not
 * collect from the person (GDPR Art. 14): the mail says what is published,
 * how to change it and links the privacy policy.
 *
 * Sent once per course, for the speaker's first session in it. A program-wide
 * session is shown on every course of its program, so there the program is
 * the unit instead. It is skipped when the person added themselves or
 * organizes the course (or a course of the program), since they already know.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
const GRAPHQL_REQUEST_TIMEOUT_MS = 30000;

const GET_SPEAKER_DETAILS = gql`
  query GetSpeakerDetails($sessionSpeakerId: Int!) {
    SessionSpeaker_by_pk(id: $sessionSpeakerId) {
      id
      userId
      User {
        id
        firstName
        lastName
        email
        status
      }
      Session {
        Course {
          id
          title
        }
        Program {
          id
          title
        }
      }
    }
  }
`;

// Earlier speaker rows of this user in the same course (or program) mean the
// mail already went out. Only lower ids count, so two sessions added at the
// same moment still produce exactly one mail (from the first row) instead of
// none.
const GET_PRIOR_INVOLVEMENT = gql`
  query GetSpeakerPriorInvolvement(
    $sessionSpeakerId: Int!
    $userId: uuid!
    $sessionWhere: Session_bool_exp!
    $instructorWhere: CourseInstructor_bool_exp!
  ) {
    SessionSpeaker_aggregate(
      where: { id: { _lt: $sessionSpeakerId }, userId: { _eq: $userId }, Session: $sessionWhere }
    ) {
      aggregate {
        count
      }
    }
    CourseInstructor_aggregate(where: { _and: [{ userId: { _eq: $userId } }, $instructorWhere] }) {
      aggregate {
        count
      }
    }
  }
`;

const noAction = (reason) => ({ success: true, messageKey: 'NO_ACTION_NEEDED', message: reason });

export default async function sendSpeakerAddedEmail(req, logger) {
  const start = Date.now();
  logger.info('########## Send Speaker Added Email ##########');

  try {
    const { event } = req.body;
    if (event?.op !== 'INSERT') {
      return noAction('No action needed for this operation');
    }

    const sessionSpeakerId = event.data.new.id;
    const actingUserId = event.session_variables?.['x-hasura-user-id'];

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const request = async (document, variables) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GRAPHQL_REQUEST_TIMEOUT_MS);
      try {
        return await client.request({ document, variables, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const details = (await request(GET_SPEAKER_DETAILS, { sessionSpeakerId }))?.SessionSpeaker_by_pk;
    if (!details) {
      // Removed again before the event was processed: nothing is published.
      return noAction('SessionSpeaker no longer exists');
    }

    const { User, Session } = details;
    if (!User?.email) {
      logger.error(`Speaker mail not sent: no email for sessionSpeakerId=${sessionSpeakerId}`);
      return { success: false, error: 'Speaker has no email address', messageKey: 'SPEAKER_NO_EMAIL' };
    }

    if (actingUserId && actingUserId === User.id) {
      return noAction('Speaker added themselves');
    }

    // Session_course_xor_program: a session belongs to exactly one of both.
    const { Course, Program } = Session;
    const scope = Course
      ? {
          sessionWhere: { courseId: { _eq: Course.id } },
          instructorWhere: { courseId: { _eq: Course.id } },
        }
      : {
          sessionWhere: { programId: { _eq: Program.id } },
          instructorWhere: { Course: { programId: { _eq: Program.id } } },
        };

    const prior = await request(GET_PRIOR_INVOLVEMENT, {
      sessionSpeakerId,
      userId: User.id,
      ...scope,
    });
    if (prior.SessionSpeaker_aggregate.aggregate.count > 0) {
      return noAction('Speaker was already informed for this course');
    }
    if (prior.CourseInstructor_aggregate.aggregate.count > 0) {
      return noAction('Speaker organizes this course');
    }

    // A program has no page of its own; its sessions show on its course pages,
    // so the portal is the closest link for a program-wide session.
    const variableReplacer = createVariableReplacer(
      {
        user: User,
        course: Course ?? { title: Program.title },
        enrollment: {},
        courseLink: Course ? undefined : process.env.FRONTEND_URL || 'https://edu.opencampus.sh',
      },
      () => ''
    );

    const emailResult = await queueEmail({
      templateType: 'SESSION_SPEAKER_ADDED',
      variableReplacer,
      recipientEmail: User.email,
      recipientUser: User,
      courseId: Course?.id ?? null,
      client,
      logger,
    });

    if (!emailResult.success) {
      logger.error(`Failed to queue speaker added email: ${emailResult.error}`, { duration: Date.now() - start });
      return {
        success: false,
        error: emailResult.error,
        messageKey: emailResult.messageKey || 'EMAIL_QUEUE_FAILED',
      };
    }

    logger.info('sendSpeakerAddedEmail completed', {
      duration: Date.now() - start,
      courseId: Course?.id,
      programId: Program?.id,
      mailId: emailResult.mailId,
    });

    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: emailResult.mailId,
      sessionSpeakerId,
    };
  } catch (error) {
    logger.error(`Error processing speaker added email: ${error.message}`, {
      error,
      duration: Date.now() - start,
    });
    return {
      success: false,
      error: error.message,
      messageKey: 'EMAIL_PROCESSING_FAILED',
    };
  }
}
