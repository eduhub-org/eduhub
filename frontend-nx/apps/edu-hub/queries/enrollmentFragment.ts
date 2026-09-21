import { gql } from '@apollo/client';

export const ENROLLMENT_FRAGMENT = gql`
  fragment EnrollmentFragment on CourseEnrollment {
    userId
    courseId
    invitationExpirationDate
    id
    created_at
    status
    billingOrganizationId
    achievementCertificateURL
    attendanceCertificateURL
    # Newest first, and deliberately unlimited: an enrollment can carry several
    # invoices (a retry opens a second checkout session), so callers asking
    # whether it was ever paid need all of them. Readers that want the most
    # recent attempt still take the first element.
    Invoices(order_by: { created_at: desc }) {
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
