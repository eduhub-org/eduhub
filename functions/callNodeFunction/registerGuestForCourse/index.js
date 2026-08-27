import { gql } from 'graphql-request';
import {
  GUEST_ALLOWED_REGISTRATION_TYPES,
  buildConfirmLink,
  buildCourseLink,
  buildPrivacyPolicyLink,
  GUEST_THROTTLE,
  NO_SUCH_USER_ID,
  createHasuraClient,
  escapeLikePattern,
  isGuestRegistrationThrottled,
  isHoneypotTripped,
  isValidEmail,
  isValidName,
  issueConfirmToken,
  normalizeEmail,
  normalizeName,
  queueGuestMail,
} from '../guestRegistration.js';

/**
 * Starts an account-less registration for an event.
 *
 * This is the only unauthenticated write path in EduHub, so nearly all of this
 * file is guard clauses. Two properties matter most:
 *
 *   1. Nothing is registered here. We create at most a GUEST `User` row and a
 *      confirmation token, then email a link. The `CourseEnrollment` appears
 *      only in `confirmGuestRegistration`, so an address someone else typed
 *      never becomes a registration and never receives follow-up mail.
 *
 *   2. The response never varies. Unknown address, existing account, pending
 *      confirmation, already enrolled - all return the same success payload.
 *      A form that answered differently would be a membership oracle for
 *      anybody who can guess an email address.
 */

const GET_COURSE = gql`
  query GetGuestRegistrationCourse($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      published
      guestRegistrationEnabled
      registrationType
      maxParticipants
      activeParticipantCount
      Program {
        id
        published
        type
        organizationId
      }
    }
  }
`;

const FIND_USER_BY_EMAIL = gql`
  query FindUserByEmail($email: String!) {
    User(where: { email: { _ilike: $email } }, limit: 1) {
      id
      status
      firstName
      lastName
    }
  }
`;

const INSERT_GUEST_USER = gql`
  mutation InsertGuestUser($firstName: String!, $lastName: String!, $email: String!) {
    insert_User_one(
      object: {
        firstName: $firstName
        lastName: $lastName
        email: $email
        status: GUEST
      }
    ) {
      id
    }
  }
`;

const UPDATE_GUEST_USER_NAME = gql`
  mutation UpdateGuestUserName($id: uuid!, $firstName: String!, $lastName: String!) {
    update_User_by_pk(
      pk_columns: { id: $id }
      _set: { firstName: $firstName, lastName: $lastName }
    ) {
      id
    }
  }
`;

const FIND_EXISTING_ENROLLMENT = gql`
  query FindGuestEnrollment($userId: uuid!, $courseId: Int!) {
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

/**
 * Volume counters, all over the last hour.
 *
 * Every `MailLog` insert becomes a real Mailgun send, and this endpoint needs no
 * credential, so without these a script could mint unbounded guest rows and aim
 * unbounded mail at addresses of its choosing. The cost is money and, worse,
 * sender-domain reputation: bounces from unverified addresses are what get a
 * domain throttled.
 *
 * Three scopes, narrowest first:
 *   perAddress  keeps one inbox from being bombed
 *   perCourse   keeps one event from being used as a mail cannon
 *   global      backstop across every event
 *
 * Hasura CE cannot enforce per-role rate limits (`api_limits` is a Cloud/EE
 * feature and the file is empty), so this is the only layer that can hold.
 */
const COUNT_RECENT = gql`
  query CountRecentGuestRegistrations($userId: uuid!, $courseId: Int!, $since: timestamptz!) {
    perAddress: GuestRegistrationToken_aggregate(
      where: { userId: { _eq: $userId }, created_at: { _gt: $since } }
    ) {
      aggregate {
        count
      }
    }
    perCourse: GuestRegistrationToken_aggregate(
      where: { courseId: { _eq: $courseId }, created_at: { _gt: $since } }
    ) {
      aggregate {
        count
      }
    }
    global: User_aggregate(
      where: { status: { _eq: GUEST }, created_at: { _gt: $since } }
    ) {
      aggregate {
        count
      }
    }
  }
`;


/** The single response every caller gets, whatever actually happened. */
const GENERIC_SUCCESS = {
  success: true,
  messageKey: 'GUEST_REGISTRATION_CONFIRMATION_SENT',
};

export default async function registerGuestForCourse(req, logger) {
  logger.info('########## Register Guest For Course ##########');

  try {
    const input = req.body?.input ?? {};
    const courseId = Number(input.courseId);
    const firstName = normalizeName(input.firstName);
    const lastName = normalizeName(input.lastName);
    const email = normalizeEmail(input.email);
    const acceptTerms = input.acceptTerms === true;
    const newsletterOptIn = input.newsletterOptIn === true;

    // Honeypot. The form has a matching hidden field, but that check is client
    // side and a script calling this action directly never sees it - so the
    // decisive check has to be here. Answer exactly as we would a person, so an
    // automated submitter learns nothing from the response.
    if (isHoneypotTripped(input.website)) {
      logger.warn(`Guest registration honeypot triggered for course ${courseId}`);
      return GENERIC_SUCCESS;
    }

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return { success: false, messageKey: 'INVALID_COURSE' };
    }
    if (!isValidName(firstName) || !isValidName(lastName)) {
      return { success: false, messageKey: 'INVALID_NAME' };
    }
    if (!isValidEmail(email)) {
      return { success: false, messageKey: 'INVALID_EMAIL' };
    }
    // Consent to the terms and privacy policy is a precondition, not a
    // preference: without it we have no basis on which to store anything.
    if (!acceptTerms) {
      return { success: false, messageKey: 'TERMS_NOT_ACCEPTED' };
    }

    const client = createHasuraClient();

    const courseData = await client.request(GET_COURSE, { courseId });
    const course = courseData?.Course_by_pk;

    // Every one of these is a hard no. They are reported plainly because they
    // describe the event, not the person - nothing here leaks about the address.
    if (!course || !course.published || !course.Program?.published) {
      return { success: false, messageKey: 'COURSE_NOT_AVAILABLE' };
    }
    if (!course.guestRegistrationEnabled) {
      return { success: false, messageKey: 'GUEST_REGISTRATION_NOT_ENABLED' };
    }
    if (course.Program.type !== 'EVENTS') {
      return { success: false, messageKey: 'GUEST_REGISTRATION_NOT_ENABLED' };
    }
    if (!GUEST_ALLOWED_REGISTRATION_TYPES.has(course.registrationType)) {
      return { success: false, messageKey: 'GUEST_REGISTRATION_NOT_ENABLED' };
    }
    if (
      course.maxParticipants != null &&
      course.activeParticipantCount != null &&
      course.activeParticipantCount >= course.maxParticipants
    ) {
      return { success: false, messageKey: 'COURSE_FULL' };
    }

    const courseLink = buildCourseLink(course.id);

    const existingUserData = await client.request(FIND_USER_BY_EMAIL, {
      email: escapeLikePattern(email),
    });
    const existingUser = existingUserData?.User?.[0];

    // The address already belongs to a real account. Create nothing, and tell
    // only the address owner - by mail, not in the response - to log in instead.
    // This keeps a guest row from shadowing a real account, and keeps the
    // account's existence out of the API answer.
    if (existingUser && existingUser.status !== 'GUEST' && existingUser.status !== 'DELETED') {
      await queueGuestMail(client, logger, {
        templateType: 'GUEST_ALREADY_HAS_ACCOUNT',
        to: email,
        values: {
          '[Guest:CourseName]': course.title,
          '[Guest:LoginLink]': `${courseLink}?force_login=true`,
        },
        metadata: { type: 'GUEST_ALREADY_HAS_ACCOUNT', courseId: course.id },
      });
      logger.info(`Guest registration attempted for existing account, course ${course.id}`);
      return GENERIC_SUCCESS;
    }

    if (existingUser) {
      const enrollmentData = await client.request(FIND_EXISTING_ENROLLMENT, {
        userId: existingUser.id,
        courseId: course.id,
      });
      // Already registered. Sending a second confirmation would let anyone
      // re-trigger mail to this address at will, so we stop here - the guest
      // already holds a manage link from the first confirmation.
      if (enrollmentData?.CourseEnrollment?.length) {
        logger.info(`Guest already enrolled in course ${course.id}, no mail queued`);
        return GENERIC_SUCCESS;
      }
    }

    // Checked before anything is written, and for new addresses as well as
    // known ones: an attacker cycling through fresh addresses is the case that
    // actually costs us mail volume.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await client.request(COUNT_RECENT, {
      userId: existingUser?.id ?? NO_SUCH_USER_ID,
      courseId: course.id,
      since,
    });
    const counts = {
      perAddress: recent?.perAddress?.aggregate?.count ?? 0,
      perCourse: recent?.perCourse?.aggregate?.count ?? 0,
      global: recent?.global?.aggregate?.count ?? 0,
    };

    if (isGuestRegistrationThrottled(counts)) {
      logger.warn(
        `Guest registration throttled for course ${course.id} ` +
          `(address=${counts.perAddress}/${GUEST_THROTTLE.perAddress}, ` +
          `course=${counts.perCourse}/${GUEST_THROTTLE.perCourse}, ` +
          `global=${counts.global}/${GUEST_THROTTLE.global})`
      );
      return GENERIC_SUCCESS;
    }

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      // Someone re-submitting with a corrected spelling should see the
      // correction; the address is the identity, the name is just a label.
      if (existingUser.firstName !== firstName || existingUser.lastName !== lastName) {
        await client.request(UPDATE_GUEST_USER_NAME, { id: userId, firstName, lastName });
      }
    } else {
      const inserted = await client.request(INSERT_GUEST_USER, { firstName, lastName, email });
      userId = inserted.insert_User_one.id;
      logger.info(`Created GUEST user for course ${course.id}`);
    }

    const rawToken = await issueConfirmToken(client, userId, course.id, newsletterOptIn);

    await queueGuestMail(client, logger, {
      templateType: 'GUEST_REGISTRATION_CONFIRM',
      to: email,
      values: {
        '[User:FirstName]': firstName,
        '[User:LastName]': lastName,
        '[Guest:CourseName]': course.title,
        '[Guest:ConfirmLink]': buildConfirmLink(rawToken),
        '[Guest:PrivacyPolicyLink]': buildPrivacyPolicyLink(),
      },
      metadata: { type: 'GUEST_REGISTRATION_CONFIRM', courseId: course.id },
    });

    return GENERIC_SUCCESS;
  } catch (error) {
    logger.error(`Error in registerGuestForCourse: ${error.message}`, { error });
    return {
      success: false,
      error: 'Guest registration could not be processed.',
      messageKey: 'GUEST_REGISTRATION_FAILED',
    };
  }
}
