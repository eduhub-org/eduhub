import { gql } from 'graphql-request';
import {
  buildManageToken,
  createHasuraClient,
  markConfirmTokenUsed,
  resolveConfirmToken,
} from '../guestRegistration.js';

/**
 * Redeems a guest double opt-in link.
 *
 * This is where the registration actually comes into existence. Inserting the
 * `CourseEnrollment` fires the existing `send_enrollment_status_email` trigger,
 * so the guest gets the ordinary REGISTRATION_CONFIRMED mail - and from then on
 * every session reminder, reschedule notice and cancellation reaches them
 * through the same pipeline every other participant uses. No guest-specific
 * mail plumbing exists, by design.
 */

const GET_COURSE = gql`
  query GetConfirmCourse($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      published
      guestRegistrationEnabled
      maxParticipants
      activeParticipantCount
      Program {
        published
        organizationId
      }
    }
  }
`;

const FIND_EXISTING_ENROLLMENT = gql`
  query FindConfirmEnrollment($userId: uuid!, $courseId: Int!) {
    CourseEnrollment(
      where: {
        userId: { _eq: $userId }
        courseId: { _eq: $courseId }
        status: { _nin: [CANCELLED, REJECTED, ABORTED] }
      }
      limit: 1
    ) {
      id
    }
  }
`;

const INSERT_ENROLLMENT = gql`
  mutation InsertGuestEnrollment($userId: uuid!, $courseId: Int!, $termsAcceptedAt: timestamptz!) {
    insert_CourseEnrollment_one(
      object: {
        userId: $userId
        courseId: $courseId
        status: REGISTERED
        termsAcceptedAt: $termsAcceptedAt
      }
    ) {
      id
    }
  }
`;

/**
 * Marketing consent is only recorded now, once the address has proven to belong
 * to the person using it. Status PENDING hands it to the existing Ghost sync
 * trigger, which runs its own double opt-in and owns the unsubscribe link.
 */
const UPSERT_NEWSLETTER_SUBSCRIPTION = gql`
  mutation UpsertGuestNewsletterSubscription($userId: uuid!, $organizationId: Int!) {
    insert_OrganizationNewsletterSubscription_one(
      object: {
        userId: $userId
        organizationId: $organizationId
        status: "PENDING"
        source: "CHECKBOX"
      }
      on_conflict: {
        constraint: OrganizationNewsletterSubscription_pkey
        update_columns: [status, source]
      }
    ) {
      userId
    }
  }
`;

export default async function confirmGuestRegistration(req, logger) {
  logger.info('########## Confirm Guest Registration ##########');

  try {
    const rawToken = req.body?.input?.token;
    const client = createHasuraClient();

    const resolved = await resolveConfirmToken(client, rawToken);
    if (!resolved.ok) {
      return { success: false, messageKey: resolved.messageKey };
    }

    const { token } = resolved;

    const courseData = await client.request(GET_COURSE, { courseId: token.courseId });
    const course = courseData?.Course_by_pk;

    // Re-checked rather than trusted from registration time: the token is valid
    // for a week, and the event may have been unpublished or filled since.
    if (!course || !course.published || !course.Program?.published || !course.guestRegistrationEnabled) {
      return { success: false, messageKey: 'COURSE_NOT_AVAILABLE' };
    }

    const existing = await client.request(FIND_EXISTING_ENROLLMENT, {
      userId: token.userId,
      courseId: course.id,
    });

    // Treated as success: a double-clicked link should look like it worked,
    // not like an error.
    if (existing?.CourseEnrollment?.length) {
      await markConfirmTokenUsed(client, token.id);
      return {
        success: true,
        courseId: course.id,
        courseTitle: course.title,
        manageToken: buildManageToken(token.userId),
        messageKey: 'GUEST_REGISTRATION_ALREADY_CONFIRMED',
      };
    }

    if (
      course.maxParticipants != null &&
      course.activeParticipantCount != null &&
      course.activeParticipantCount >= course.maxParticipants
    ) {
      return { success: false, messageKey: 'COURSE_FULL' };
    }

    // Recorded at confirmation rather than at submission: the registration only
    // legally exists once the address is confirmed, so that is when consent to
    // the terms takes effect.
    await client.request(INSERT_ENROLLMENT, {
      userId: token.userId,
      courseId: course.id,
      termsAcceptedAt: new Date().toISOString(),
    });

    await markConfirmTokenUsed(client, token.id);

    if (token.newsletterOptIn && course.Program.organizationId) {
      await client.request(UPSERT_NEWSLETTER_SUBSCRIPTION, {
        userId: token.userId,
        organizationId: course.Program.organizationId,
      });
      logger.info(`Recorded guest newsletter consent for organization ${course.Program.organizationId}`);
    }

    logger.info(`Guest registration confirmed for course ${course.id}`);

    return {
      success: true,
      courseId: course.id,
      courseTitle: course.title,
      manageToken: buildManageToken(token.userId),
      messageKey: 'GUEST_REGISTRATION_CONFIRMED',
    };
  } catch (error) {
    logger.error(`Error in confirmGuestRegistration: ${error.message}`, { error });
    return {
      success: false,
      error: 'Guest registration could not be confirmed.',
      messageKey: 'GUEST_CONFIRMATION_FAILED',
    };
  }
}
