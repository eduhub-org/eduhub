import { gql } from '@apollo/client';

export const ENROLLMENT_FRAGMENT = gql`
  fragment EnrollmentFragment on CourseEnrollment {
    userId
    courseId
    invitationExpirationDate
    id
    status
    billingOrganizationId
    achievementCertificateURL
    attendanceCertificateURL
    Invoices(limit: 1, order_by: { created_at: desc }) {
      id
      status
      stripeHostedInvoiceUrl
      stripeInvoicePdfUrl
    }
  }
`;

export const ADMIN_ENROLLMENT_FRAGMENT = gql`
  ${ENROLLMENT_FRAGMENT}
  fragment AdminEnrollmentFragment on CourseEnrollment {
    ...EnrollmentFragment
    motivationLetter
    motivationRating
  }
`;
