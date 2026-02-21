/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollment_bool_exp, CourseEnrollment_order_by, CourseEnrollmentStatus_enum, AttendanceStatus_enum, AchievementRecordType_enum, AchievementRecordRating_enum } from "./../../__generated__/globalTypes";

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

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors {
  __typename: "AchievementRecordAuthor";
  /**
   * ID of a user that is author of an uploaded achievement record
   */
  userId: any;
  /**
   * An object relationship
   */
  User: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors_User;
}

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementOption {
  __typename: "AchievementOption";
  /**
   * Title of an offered achievement option
   */
  title: string;
}

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords {
  __typename: "AchievementRecord";
  id: number;
  /**
   * ID of the course the record was uploaded for.
   */
  courseId: number | null;
  /**
   * URL to the uploaded file with the documentation of the record.
   */
  documentationUrl: string | null;
  /**
   * The course instructor's or mentor's rating for the achievement record
   */
  rating: AchievementRecordRating_enum;
  created_at: any | null;
  /**
   * ID of the user who uploaded the record
   */
  uploadUserId: any;
  /**
   * An array relationship
   */
  AchievementRecordAuthors: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors[];
  /**
   * An object relationship
   */
  AchievementOption: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementOption;
}

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption {
  __typename: "AchievementOption";
  id: number;
  /**
   * Title of an offered achievement option
   */
  title: string;
  /**
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
  /**
   * An array relationship
   */
  AchievementRecords: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords[];
}

export interface CourseParticipations_Course_by_pk_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  /**
   * An object relationship
   */
  AchievementOption: CourseParticipations_Course_by_pk_AchievementOptionCourses_AchievementOption;
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
  AchievementOptionCourses: CourseParticipations_Course_by_pk_AchievementOptionCourses[];
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
