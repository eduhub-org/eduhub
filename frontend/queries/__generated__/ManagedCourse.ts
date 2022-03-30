/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum, CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourse
// ====================================================

export interface ManagedCourse_Course_by_pk_Program {
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
}

export interface ManagedCourse_Course_by_pk_CourseInstructors_Expert_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  id: any;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface ManagedCourse_Course_by_pk_CourseInstructors_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: ManagedCourse_Course_by_pk_CourseInstructors_Expert_User;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface ManagedCourse_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: ManagedCourse_Course_by_pk_CourseInstructors_Expert;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  /**
   * The last day a user can confirm his/her invitation to the given course
   */
  invitationExpirationDate: any | null;
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
}

export interface ManagedCourse_Course_by_pk_CourseLocations {
  __typename: "CourseLocation";
  id: number;
  /**
   * HTTP address of the video conference for online participation (only provided if it is an online address)
   */
  link: string;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: string | null;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * The link to a video conference call (if it is an online location)
   */
  link: string | null;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert_User {
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
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert_User;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  Expert: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert;
}

export interface ManagedCourse_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * An array relationship
   */
  SessionAddresses: ManagedCourse_Course_by_pk_Sessions_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers[];
}

export interface ManagedCourse_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The day of the week the course takes place.
   */
  weekDay: string | null;
  /**
   * A text providing info about the costs of a participation.
   */
  cost: string;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page
   */
  status: CourseStatus_enum;
  /**
   * An array of texts including the learning goals for the course
   */
  learningGoals: string | null;
  /**
   * The value decides whether the course is visible for users or anoymous persons.
   */
  visibility: boolean | null;
  /**
   * Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course
   */
  achievementCertificatePossible: boolean;
  /**
   * Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)
   */
  attendanceCertificatePossible: boolean;
  /**
   * The link to the chat of the course (e.g. a mattermost channel)
   */
  chatLink: string | null;
  /**
   * An object relationship
   */
  Program: ManagedCourse_Course_by_pk_Program | null;
  /**
   * An array relationship
   */
  CourseInstructors: ManagedCourse_Course_by_pk_CourseInstructors[];
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[];
  /**
   * An array relationship
   */
  CourseLocations: ManagedCourse_Course_by_pk_CourseLocations[];
  /**
   * An array relationship
   */
  Sessions: ManagedCourse_Course_by_pk_Sessions[];
}

export interface ManagedCourse {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: ManagedCourse_Course_by_pk | null;
}

export interface ManagedCourseVariables {
  id: number;
}
