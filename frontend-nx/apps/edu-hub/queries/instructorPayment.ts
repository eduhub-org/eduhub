import { gql } from '@apollo/client';

// Payment rows are row-filtered in Hasura: an instructor only ever gets the payment of courses
// they teach; for everyone else InstructorPayment / PaymentShare resolve to null.

const COURSE_TEAM_FIELDS = gql`
  fragment CourseTeamFields on Course {
    id
    InstructorPayment {
      id
      totalAmount
      lockedAt
    }
    CourseInstructors(order_by: { id: asc }) {
      id
      PaymentShare {
        id
        amount
        invoiceURL
      }
      User {
        id
        firstName
        lastName
        picture
        externalProfile
      }
    }
    Program {
      id
      InstructorInvoiceTemplate {
        id
      }
    }
  }
`;

export const COURSE_TEAM = gql`
  ${COURSE_TEAM_FIELDS}
  query CourseTeam($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      ...CourseTeamFields
      CourseInstructors(order_by: { id: asc }) {
        id
        User {
          id
          matrixUserHandle
        }
      }
    }
  }
`;

// Org admins may not read User.matrixUserHandle, so they get the team without Element links.
export const COURSE_TEAM_WITHOUT_MATRIX = gql`
  ${COURSE_TEAM_FIELDS}
  query CourseTeamWithoutMatrix($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      ...CourseTeamFields
    }
  }
`;

export const UPSERT_COURSE_INSTRUCTOR_PAYMENT_SHARE = gql`
  mutation UpsertCourseInstructorPaymentShare($courseInstructorId: Int!, $amount: Int!) {
    insert_CourseInstructorPaymentShare_one(
      object: { courseInstructorId: $courseInstructorId, amount: $amount }
      on_conflict: { constraint: CourseInstructorPaymentShare_courseInstructorId_key, update_columns: [amount] }
    ) {
      id
      amount
    }
  }
`;

export const UPSERT_COURSE_INSTRUCTOR_PAYMENT_TOTAL = gql`
  mutation UpsertCourseInstructorPaymentTotal($courseId: Int!, $totalAmount: Int!) {
    insert_CourseInstructorPayment_one(
      object: { courseId: $courseId, totalAmount: $totalAmount }
      on_conflict: { constraint: CourseInstructorPayment_courseId_key, update_columns: [totalAmount] }
    ) {
      id
      totalAmount
    }
  }
`;

export const UNLOCK_COURSE_INSTRUCTOR_PAYMENT = gql`
  mutation UnlockCourseInstructorPayment($courseId: Int!) {
    update_CourseInstructorPayment(where: { courseId: { _eq: $courseId } }, _set: { lockedAt: null }) {
      affected_rows
    }
  }
`;

export const GENERATE_INSTRUCTOR_INVOICE = gql`
  mutation GenerateInstructorInvoice($courseId: Int!) {
    generateInstructorInvoice(courseId: $courseId) {
      success
      path
      error
      messageKey
    }
  }
`;
