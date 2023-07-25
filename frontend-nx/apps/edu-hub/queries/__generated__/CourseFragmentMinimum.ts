/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum, Weekday_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: CourseFragmentMinimum
// ====================================================

export interface CourseFragmentMinimum {
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
   * A text providing info about the costs of a participation.
   */
  cost: string;
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
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
}
