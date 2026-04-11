/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum, InvoiceStatus_enum, CourseStatus_enum, Weekday_enum, CourseRegistrationType_enum, ProgramType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyCertificates
// ====================================================

export interface MyCertificates_CourseEnrollment_Invoices {
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

export interface MyCertificates_CourseEnrollment_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
  /**
   * The default application deadline for a course. It can be changed on the course level.
   */
  defaultApplicationEnd: any | null;
  /**
   * Controls whether course tiles should show an extended application period banner after the program deadline has passed while individual course deadlines are still open.
   */
  showExtendedApplicationPeriodBanner: boolean;
  /**
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  type: ProgramType_enum;
  /**
   * Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.
   */
  defaultFormbricksEnrollmentSurveyUrl: string | null;
}

export interface MyCertificates_CourseEnrollment_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page
   */
  status: CourseStatus_enum;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The language the course is given in.
   */
  language: string | null;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course
   */
  achievementCertificatePossible: boolean;
  /**
   * Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)
   */
  attendanceCertificatePossible: boolean;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The day of the week the course takes place.
   */
  weekDay: Weekday_enum;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number;
  /**
   * An array of texts including the learning goals for the course
   */
  learningGoals: string | null;
  /**
   * The link to the chat of the course (e.g. a mattermost channel)
   */
  chatLink: string | null;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * The number of maximum participants in the course.
   */
  maxParticipants: number | null;
  /**
   * A computed field, executes function "course_active_participant_count"
   */
  activeParticipantCount: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  registrationType: CourseRegistrationType_enum | null;
  /**
   * Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.
   */
  formbricksEnrollmentSurveyUrl: string | null;
  /**
   * An object relationship
   */
  Program: MyCertificates_CourseEnrollment_Course_Program;
}

export interface MyCertificates_CourseEnrollment {
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
  Invoices: MyCertificates_CourseEnrollment_Invoices[];
  /**
   * An object relationship
   */
  Course: MyCertificates_CourseEnrollment_Course;
}

export interface MyCertificates {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: MyCertificates_CourseEnrollment[];
}

export interface MyCertificatesVariables {
  userId: any;
}
