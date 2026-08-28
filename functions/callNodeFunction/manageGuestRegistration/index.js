import crypto from 'node:crypto';
import { gql } from 'graphql-request';
import { createHasuraClient, verifyManageToken } from '../guestRegistration.js';

/**
 * Token-authenticated self-service for guests.
 *
 * A guest has no login, so this is the whole of their GDPR Art. 15 (access),
 * Art. 17 (erasure) and cancellation surface. The manage link is carried in
 * every mail they receive, which is what makes those rights usable in practice
 * rather than only on paper.
 *
 * Operations:
 *   LIST              what we hold and which events they are registered for
 *   CANCEL_ENROLLMENT withdraw from one event (keeps the guest record)
 *   DELETE_ALL_DATA   erase the person entirely
 */

const OPERATIONS = new Set(['LIST', 'CANCEL_ENROLLMENT', 'DELETE_ALL_DATA']);

const GET_GUEST_STATUS = gql`
  query GetGuestStatus($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      status
    }
  }
`;

/**
 * `Course.startTime` and `endTime` are times of day (`18:00`), not dates -- the
 * date an event actually happens on lives on its `Session` rows. Reading the
 * course columns produced "18:00:00" where the page expected a timestamp, which
 * rendered as "Invalid Date" under every entry. Aggregate the sessions instead:
 * first session start to last session end is the event's real window.
 */
const GET_GUEST_OVERVIEW = gql`
  query GetGuestOverview($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      email
      CourseEnrollments {
        status
        Course {
          id
          title
          Sessions_aggregate {
            aggregate {
              min {
                startDateTime
              }
              max {
                endDateTime
              }
            }
          }
        }
      }
    }
  }
`;

const CANCEL_ENROLLMENT = gql`
  mutation CancelGuestEnrollment($userId: uuid!, $courseId: Int!) {
    update_CourseEnrollment(
      where: {
        userId: { _eq: $userId }
        courseId: { _eq: $courseId }
        status: { _nin: [CANCELLED, REJECTED, ABORTED] }
      }
      _set: { status: CANCELLED }
    ) {
      affected_rows
    }
  }
`;

/**
 * Withdraws the guest from everything still ahead of them, as part of erasure.
 *
 * COMPLETED is excluded along with the terminal states: that enrollment records
 * an event the person actually attended, and rewriting it would falsify the
 * history rather than erase anything -- the row carries no personal data once
 * the User it points at is anonymized.
 *
 * Leaving open enrollments alone was the original behaviour, but it contradicted
 * what the page promises ("storniert alle offenen Anmeldungen"), and now that
 * REGISTERED counts towards maxParticipants it also meant an erased guest held a
 * seat on an event they had asked to be forgotten from.
 */
const CANCEL_ALL_ENROLLMENTS = gql`
  mutation CancelAllGuestEnrollments($userId: uuid!) {
    update_CourseEnrollment(
      where: {
        userId: { _eq: $userId }
        status: { _nin: [CANCELLED, REJECTED, ABORTED, COMPLETED] }
      }
      _set: { status: CANCELLED }
    ) {
      affected_rows
    }
  }
`;

const GET_NEWSLETTER_SUBSCRIPTIONS = gql`
  query GetGuestNewsletterSubscriptions($userId: uuid!) {
    OrganizationNewsletterSubscription(
      where: { userId: { _eq: $userId }, status: { _neq: "UNSUBSCRIBED" } }
    ) {
      organizationId
      status
      source
    }
  }
`;

const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeGuestNewsletter($userId: uuid!) {
    update_OrganizationNewsletterSubscription(
      where: { userId: { _eq: $userId }, status: { _neq: "UNSUBSCRIBED" } }
      _set: { status: "UNSUBSCRIBED", source: "ADMIN" }
    ) {
      affected_rows
    }
  }
`;

const CHECK_NEWSLETTER_SYNCED = gql`
  query CheckGuestNewsletterSynced($userId: uuid!) {
    OrganizationNewsletterSubscription_aggregate(
      where: { userId: { _eq: $userId }, status: { _nin: ["UNSUBSCRIBED", "ERROR"] } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const ANONYMIZE_GUEST = gql`
  mutation AnonymizeGuest($userId: uuid!, $email: String!) {
    update_User_by_pk(
      pk_columns: { id: $userId }
      _set: {
        firstName: "ANON_USER"
        lastName: "ANON_USER"
        email: $email
        picture: null
        externalProfile: null
        status: DELETED
      }
    ) {
      id
    }
  }
`;

const DELETE_TOKENS = gql`
  mutation DeleteGuestTokens($userId: uuid!) {
    delete_GuestRegistrationToken(where: { userId: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

/** Same shape `anonymizeUser` produces, so anonymized rows look alike whichever
 *  path created them. */
function anonymizedEmail() {
  return `anon_${crypto.randomBytes(6).toString('hex')}@example.com`;
}

/**
 * Ghost holds the guest's real address, and `syncGhostNewsletterSubscription`
 * re-reads `User.email` when it runs. Anonymizing first would therefore send the
 * placeholder address to Ghost and leave the real one subscribed forever - so we
 * wait for the unsubscribe to land before overwriting the email.
 *
 * Bounded, and erasure wins if it times out: we anonymize anyway and log loudly,
 * because leaving identifiable data in place is the worse failure.
 */
async function waitForNewsletterUnsubscribe(client, logger, userId) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const data = await client.request(CHECK_NEWSLETTER_SYNCED, { userId });
    if ((data?.OrganizationNewsletterSubscription_aggregate?.aggregate?.count ?? 0) === 0) {
      return true;
    }
  }
  logger.error(
    `Guest newsletter unsubscribe did not confirm before erasure for user ${userId}; ` +
      'the Ghost member may need to be removed manually'
  );
  return false;
}

export default async function manageGuestRegistration(req, logger) {
  logger.info('########## Manage Guest Registration ##########');

  try {
    const input = req.body?.input ?? {};
    const operation = String(input.operation ?? 'LIST').toUpperCase();

    if (!OPERATIONS.has(operation)) {
      return { success: false, messageKey: 'INVALID_OPERATION' };
    }

    const client = createHasuraClient();

    // Stateless HMAC: valid signature proves the link came from us, but says
    // nothing about whether the guest still exists. The overview query below is
    // what rejects an already-erased record.
    const userId = verifyManageToken(input.token);
    if (!userId) {
      return { success: false, messageKey: 'INVALID_TOKEN' };
    }

    const guest = await client.request(GET_GUEST_STATUS, { userId });
    if (!guest?.User_by_pk || guest.User_by_pk.status !== 'GUEST') {
      return { success: false, messageKey: 'INVALID_TOKEN' };
    }

    if (operation === 'CANCEL_ENROLLMENT') {
      const courseId = Number(input.courseId);
      if (!Number.isInteger(courseId) || courseId <= 0) {
        return { success: false, messageKey: 'INVALID_COURSE' };
      }
      // Flipping the status to CANCELLED fires the existing enrollment-email
      // trigger, so the guest gets the standard cancellation confirmation.
      await client.request(CANCEL_ENROLLMENT, { userId, courseId });
      logger.info(`Guest cancelled enrollment in course ${courseId}`);
    }

    if (operation === 'DELETE_ALL_DATA') {
      // No cancellation mail follows this. The enrollment-email trigger is
      // asynchronous and would resolve the recipient after the anonymization
      // below, so it queues nothing usable -- and sendEnrollmentEmail now skips
      // anonymized recipients outright. Someone who asked to be forgotten should
      // not be mailed on the way out anyway.
      const cancelled = await client.request(CANCEL_ALL_ENROLLMENTS, { userId });
      logger.info(
        `Cancelled ${cancelled?.update_CourseEnrollment?.affected_rows ?? 0} ` +
          `open enrollment(s) as part of erasing user ${userId}`
      );

      const subscriptions = await client.request(GET_NEWSLETTER_SUBSCRIPTIONS, { userId });
      const hasSubscriptions = (subscriptions?.OrganizationNewsletterSubscription?.length ?? 0) > 0;

      if (hasSubscriptions) {
        await client.request(UNSUBSCRIBE_NEWSLETTER, { userId });
        await waitForNewsletterUnsubscribe(client, logger, userId);
      }

      await client.request(ANONYMIZE_GUEST, { userId, email: anonymizedEmail() });
      await client.request(DELETE_TOKENS, { userId });

      logger.info(`Guest data erased on self-service request for user ${userId}`);

      // The enrollment rows themselves stay: cancelled, pointing at an anonymous
      // record, carrying no personal data, but still counted in reporting on how
      // many people an event drew.
      return { success: true, messageKey: 'GUEST_DATA_DELETED' };
    }

    const overview = await client.request(GET_GUEST_OVERVIEW, { userId });
    const user = overview?.User_by_pk;
    if (!user) {
      return { success: false, messageKey: 'INVALID_TOKEN' };
    }

    return {
      success: true,
      messageKey: operation === 'CANCEL_ENROLLMENT' ? 'GUEST_ENROLLMENT_CANCELLED' : 'GUEST_DATA_LISTED',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      // Sorted here rather than in the query: the ordering key is now an
      // aggregate over related rows, which order_by cannot reach. Undated events
      // sort last, so anything with a real date stays on top.
      registrations: (user.CourseEnrollments ?? [])
        .filter((enrollment) => enrollment.Course)
        .map((enrollment) => {
          const sessions = enrollment.Course.Sessions_aggregate?.aggregate;
          return {
            courseId: enrollment.Course.id,
            courseTitle: enrollment.Course.title,
            startTime: sessions?.min?.startDateTime ?? null,
            endTime: sessions?.max?.endDateTime ?? null,
            status: enrollment.status,
          };
        })
        .sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return new Date(b.startTime) - new Date(a.startTime);
        }),
    };
  } catch (error) {
    logger.error(`Error in manageGuestRegistration: ${error.message}`, { error });
    return {
      success: false,
      error: 'Guest registration could not be managed.',
      messageKey: 'GUEST_MANAGE_FAILED',
    };
  }
}
