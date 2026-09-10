/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollment_bool_exp, CourseEnrollment_order_by, CourseRegistrationType_enum, CourseEnrollmentStatus_enum, InvoiceStatus_enum, MotivationRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourseApplications
// ====================================================

export interface ManagedCourseApplications_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  /**
   * Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.
   */
  defaultFormbricksEnrollmentSurveyUrl: string | null;
}

export interface ManagedCourseApplications_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_Invoices {
  __typename: "Invoice";
  id: number;
  /**
   * Invoice lifecycle status. Synced from Stripe webhooks
   */
  status: InvoiceStatus_enum;
  /**
   * Stripe-hosted invoice page URL
   */
  stripeHostedInvoiceUrl: string | null;
  /**
   * Stripe-hosted PDF download URL
   */
  stripeInvoicePdfUrl: string | null;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program {
  __typename: "Program";
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * An object relationship
   */
  Program: ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments {
  __typename: "CourseEnrollment";
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
  /**
   * An object relationship
   */
  Course: ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_User {
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
   * The user's email address
   */
  email: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
  /**
   * The user's country of residence
   */
  country: string | null;
  /**
   * An object relationship
   */
  Organization: ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_Organization | null;
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourseApplications_Course_by_pk_CourseEnrollments_User_CourseEnrollments[];
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  /**
   * The last day a user can confirm his/her invitation to the given course
   */
  invitationExpirationDate: any | null;
  id: number;
  created_at: any | null;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * Organization paying for this enrollment (B2B). NULL means the enrolling user pays personally (B2C)
   */
  billingOrganizationId: number | null;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
  /**
   * An array relationship
   */
  Invoices: ManagedCourseApplications_Course_by_pk_CourseEnrollments_Invoices[];
  /**
   * The text of the user's motivation letter
   */
  motivationLetter: string;
  /**
   * Rating that the user's motivation letter received from the course instructor
   */
  motivationRating: MotivationRating_enum;
  /**
   * An object relationship
   */
  User: ManagedCourseApplications_Course_by_pk_CourseEnrollments_User;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_aggregate_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplications_Course_by_pk_CourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplications_Course_by_pk_CourseEnrollments_aggregate_aggregate | null;
}

export interface ManagedCourseApplications_Course_by_pk_TotalCourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplications_Course_by_pk_TotalCourseEnrollments {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplications_Course_by_pk_TotalCourseEnrollments_aggregate | null;
}

export interface ManagedCourseApplications_Course_by_pk_ApprovedCourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplications_Course_by_pk_ApprovedCourseEnrollments {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplications_Course_by_pk_ApprovedCourseEnrollments_aggregate | null;
}

export interface ManagedCourseApplications_Course_by_pk_InvitedCourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplications_Course_by_pk_InvitedCourseEnrollments {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplications_Course_by_pk_InvitedCourseEnrollments_aggregate | null;
}

export interface ManagedCourseApplications_Course_by_pk_ConfirmedCourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplications_Course_by_pk_ConfirmedCourseEnrollments {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplications_Course_by_pk_ConfirmedCourseEnrollments_aggregate | null;
}

export interface ManagedCourseApplications_Course_by_pk {
  __typename: "Course";
  id: number;
  registrationType: CourseRegistrationType_enum | null;
  matrixRoomId: string | null;
  /**
   * Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.
   */
  formbricksEnrollmentSurveyUrl: string | null;
  /**
   * An object relationship
   */
  Program: ManagedCourseApplications_Course_by_pk_Program;
  /**
   * An array relationship
   */
  Sessions: ManagedCourseApplications_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourseApplications_Course_by_pk_CourseEnrollments[];
  /**
   * An aggregate relationship
   */
  CourseEnrollments_aggregate: ManagedCourseApplications_Course_by_pk_CourseEnrollments_aggregate;
  /**
   * An aggregate relationship
   */
  TotalCourseEnrollments: ManagedCourseApplications_Course_by_pk_TotalCourseEnrollments;
  /**
   * An aggregate relationship
   */
  ApprovedCourseEnrollments: ManagedCourseApplications_Course_by_pk_ApprovedCourseEnrollments;
  /**
   * An aggregate relationship
   */
  InvitedCourseEnrollments: ManagedCourseApplications_Course_by_pk_InvitedCourseEnrollments;
  /**
   * An aggregate relationship
   */
  ConfirmedCourseEnrollments: ManagedCourseApplications_Course_by_pk_ConfirmedCourseEnrollments;
}

export interface ManagedCourseApplications {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: ManagedCourseApplications_Course_by_pk | null;
}

export interface ManagedCourseApplicationsVariables {
  id: number;
  limit?: number | null;
  offset?: number | null;
  filter?: CourseEnrollment_bool_exp | null;
  order_by?: CourseEnrollment_order_by[] | null;
}
