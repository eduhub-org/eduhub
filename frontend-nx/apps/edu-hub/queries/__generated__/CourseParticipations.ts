/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollment_bool_exp, CourseEnrollment_order_by, CourseEnrollmentStatus_enum, AttendanceStatus_enum, ProjectStatus_enum, ProjectRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseParticipations
// ====================================================

export interface CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances_Session {
  __typename: "Session";
  id: number;
}

export interface CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances {
  __typename: "Attendance";
  id: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * The source that provided the recorded names of the attendees.
   */
  source: string;
  /**
   * An object relationship
   */
  Session: CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances_Session;
}

export interface CourseParticipations_Course_by_pk_CourseEnrollments_User {
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
   * An array relationship
   */
  Attendances: CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances[];
}

export interface CourseParticipations_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
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
  User: CourseParticipations_Course_by_pk_CourseEnrollments_User;
}

export interface CourseParticipations_Course_by_pk_CourseEnrollments_aggregate_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface CourseParticipations_Course_by_pk_CourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate";
  aggregate: CourseParticipations_Course_by_pk_CourseEnrollments_aggregate_aggregate | null;
}

export interface CourseParticipations_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The title of the session
   */
  title: string;
}

export interface CourseParticipations_Course_by_pk_ProjectCourses_Project_ProjectAuthors {
  __typename: "ProjectAuthor";
  userId: any;
}

export interface CourseParticipations_Course_by_pk_ProjectCourses_Project {
  __typename: "Project";
  id: number;
  title: string;
  status: ProjectStatus_enum;
  rating: ProjectRating_enum | null;
  ratingComment: string | null;
  /**
   * An array relationship
   */
  ProjectAuthors: CourseParticipations_Course_by_pk_ProjectCourses_Project_ProjectAuthors[];
}

export interface CourseParticipations_Course_by_pk_ProjectCourses {
  __typename: "ProjectCourse";
  /**
   * An object relationship
   */
  Project: CourseParticipations_Course_by_pk_ProjectCourses_Project;
}

export interface CourseParticipations_Course_by_pk {
  __typename: "Course";
  /**
   * An array relationship
   */
  CourseEnrollments: CourseParticipations_Course_by_pk_CourseEnrollments[];
  /**
   * An aggregate relationship
   */
  CourseEnrollments_aggregate: CourseParticipations_Course_by_pk_CourseEnrollments_aggregate;
  /**
   * An array relationship
   */
  Sessions: CourseParticipations_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  ProjectCourses: CourseParticipations_Course_by_pk_ProjectCourses[];
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)
   */
  attendanceCertificatePossible: boolean;
  /**
   * Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course
   */
  achievementCertificatePossible: boolean;
}

export interface CourseParticipations {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: CourseParticipations_Course_by_pk | null;
}

export interface CourseParticipationsVariables {
  courseId: number;
  limit?: number | null;
  offset?: number | null;
  filter?: CourseEnrollment_bool_exp | null;
  order_by?: CourseEnrollment_order_by[] | null;
}
