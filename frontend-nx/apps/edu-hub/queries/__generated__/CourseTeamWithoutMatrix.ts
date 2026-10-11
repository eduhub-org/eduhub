/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseTeamWithoutMatrix
// ====================================================

export interface CourseTeamWithoutMatrix_Course_by_pk_InstructorPayment {
  __typename: "CourseInstructorPayment";
  id: number;
  /**
   * Total instructor fee for the course in cents (e.g. 50000 = €500.00).
   */
  totalAmount: number;
  /**
   * Set when the first instructor generates an invoice; afterwards the split can no longer be changed by instructors. Admins reset it to NULL to unlock.
   */
  lockedAt: any | null;
}

export interface CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors_PaymentShare {
  __typename: "CourseInstructorPaymentShare";
  id: number;
  /**
   * Share of the course fee in cents.
   */
  amount: number;
  /**
   * Bucket path of the instructor's most recently generated invoice PDF.
   */
  invoiceURL: string | null;
}

export interface CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
}

export interface CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  PaymentShare: CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors_PaymentShare | null;
  /**
   * An object relationship
   */
  User: CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors_User;
}

export interface CourseTeamWithoutMatrix_Course_by_pk_Program_InstructorInvoiceTemplate {
  __typename: "CertificateTemplate";
  id: number;
}

export interface CourseTeamWithoutMatrix_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  /**
   * An object relationship
   */
  InstructorInvoiceTemplate: CourseTeamWithoutMatrix_Course_by_pk_Program_InstructorInvoiceTemplate | null;
}

export interface CourseTeamWithoutMatrix_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * An object relationship
   */
  InstructorPayment: CourseTeamWithoutMatrix_Course_by_pk_InstructorPayment | null;
  /**
   * An array relationship
   */
  CourseInstructors: CourseTeamWithoutMatrix_Course_by_pk_CourseInstructors[];
  /**
   * An object relationship
   */
  Program: CourseTeamWithoutMatrix_Course_by_pk_Program;
}

export interface CourseTeamWithoutMatrix {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: CourseTeamWithoutMatrix_Course_by_pk | null;
}

export interface CourseTeamWithoutMatrixVariables {
  courseId: number;
}
