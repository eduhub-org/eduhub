import { gql } from '@apollo/client';

/**
 * Guest (account-less) event registration.
 *
 * All three are Hasura Actions rather than table mutations: they are the only
 * unauthenticated writes in the application, so they run server-side where the
 * course can be re-validated, the address normalized and rate limits applied.
 * No table grants the `anonymous` role write access.
 *
 * Call them with `context: { role: AuthRoles.anonymous }`.
 */

/**
 * Starts a registration. Deliberately returns nothing about the address: the
 * same payload comes back whether it was unknown, already had an account, or
 * already had a pending confirmation, so the form cannot be used to find out
 * whether someone has an EduHub account.
 */
export const REGISTER_GUEST_FOR_COURSE = gql`
  mutation RegisterGuestForCourse(
    $courseId: Int!
    $firstName: String!
    $lastName: String!
    $email: String!
    $acceptTerms: Boolean!
    $newsletterOptIn: Boolean
  ) {
    registerGuestForCourse(
      courseId: $courseId
      firstName: $firstName
      lastName: $lastName
      email: $email
      acceptTerms: $acceptTerms
      newsletterOptIn: $newsletterOptIn
    ) {
      success
      error
      messageKey
    }
  }
`;

/** Redeems the double opt-in link. Returns the manage token so the confirmation
 *  page can offer the guest their self-service link straight away. */
export const CONFIRM_GUEST_REGISTRATION = gql`
  mutation ConfirmGuestRegistration($token: String!) {
    confirmGuestRegistration(token: $token) {
      success
      courseId
      courseTitle
      manageToken
      error
      messageKey
    }
  }
`;

/**
 * Token-authenticated self-service. `operation` is one of LIST,
 * CANCEL_ENROLLMENT or DELETE_ALL_DATA - a guest has no login, so this is how
 * they exercise GDPR Art. 15 and Art. 17.
 */
export const MANAGE_GUEST_REGISTRATION = gql`
  mutation ManageGuestRegistration($token: String!, $operation: String!, $courseId: Int) {
    manageGuestRegistration(token: $token, operation: $operation, courseId: $courseId) {
      success
      firstName
      lastName
      email
      registrations {
        courseId
        courseTitle
        startTime
        endTime
        status
      }
      error
      messageKey
    }
  }
`;
