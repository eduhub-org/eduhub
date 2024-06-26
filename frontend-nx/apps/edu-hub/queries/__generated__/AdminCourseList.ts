/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_bool_exp, Weekday_enum, LocationOption_enum, University_enum, CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AdminCourseList
// ====================================================

export interface AdminCourseList_Course_Sessions_SessionAddresses_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
  /**
   * Will be used as default for any new session address.
   */
  defaultSessionAddress: string | null;
}

export interface AdminCourseList_Course_Sessions_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  /**
   * An object relationship
   */
  CourseLocation: AdminCourseList_Course_Sessions_SessionAddresses_CourseLocation | null;
}

export interface AdminCourseList_Course_Sessions_SessionSpeakers_Expert_User {
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
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
}

export interface AdminCourseList_Course_Sessions_SessionSpeakers_Expert {
  __typename: "Expert";
  /**
   * An object relationship
   */
  User: AdminCourseList_Course_Sessions_SessionSpeakers_Expert_User;
}

export interface AdminCourseList_Course_Sessions_SessionSpeakers {
  __typename: "SessionSpeaker";
  /**
   * An object relationship
   */
  Expert: AdminCourseList_Course_Sessions_SessionSpeakers_Expert;
}

export interface AdminCourseList_Course_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The title of the session
   */
  title: string;
  /**
   * An array relationship
   */
  SessionAddresses: AdminCourseList_Course_Sessions_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: AdminCourseList_Course_Sessions_SessionSpeakers[];
}

export interface AdminCourseList_Course_CourseInstructors_Expert_User {
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
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
}

export interface AdminCourseList_Course_CourseInstructors_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: AdminCourseList_Course_CourseInstructors_Expert_User;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface AdminCourseList_Course_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: AdminCourseList_Course_CourseInstructors_Expert;
}

export interface AdminCourseList_Course_CourseLocations {
  __typename: "CourseLocation";
  id: number;
  /**
   * Will be used as default for any new session address.
   */
  defaultSessionAddress: string | null;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
}

export interface AdminCourseList_Course_Program {
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
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  /**
   * Sets the achievement certificates for all courses of htis program to be visible for the recipients.
   */
  visibilityAchievementCertificate: boolean | null;
  /**
   * Sets the participation certificates for all courses of htis program to be visible for the recipients.
   */
  visibilityAttendanceCertificate: boolean | null;
}

export interface AdminCourseList_Course_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface AdminCourseList_Course_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  /**
   * An object relationship
   */
  CourseGroupOption: AdminCourseList_Course_CourseGroups_CourseGroupOption;
  groupOptionId: number;
}

export interface AdminCourseList_Course_DegreeCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface AdminCourseList_Course_DegreeCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * An object relationship
   */
  Program: AdminCourseList_Course_DegreeCourses_Course_Program;
}

export interface AdminCourseList_Course_DegreeCourses {
  __typename: "CourseDegree";
  id: number;
  /**
   * ID of the course which is assigned to a degree
   */
  courseId: number;
  /**
   * An object relationship
   */
  Course: AdminCourseList_Course_DegreeCourses_Course;
}

export interface AdminCourseList_Course_CourseEnrollments_CourseEnrollmentStatus {
  __typename: "CourseEnrollmentStatus";
  value: string;
}

export interface AdminCourseList_Course_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * An object relationship
   */
  CourseEnrollmentStatus: AdminCourseList_Course_CourseEnrollments_CourseEnrollmentStatus;
}

export interface AdminCourseList_Course_CourseDegrees_Course {
  __typename: "Course";
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface AdminCourseList_Course_CourseDegrees_DegreeCourse {
  __typename: "Course";
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface AdminCourseList_Course_CourseDegrees {
  __typename: "CourseDegree";
  id: number;
  /**
   * ID of the course that represents a degree
   */
  degreeCourseId: number;
  /**
   * An object relationship
   */
  Course: AdminCourseList_Course_CourseDegrees_Course;
  /**
   * An object relationship
   */
  DegreeCourse: AdminCourseList_Course_CourseDegrees_DegreeCourse;
}

export interface AdminCourseList_Course_AppliedAndUnratedCount_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface AdminCourseList_Course_AppliedAndUnratedCount {
  __typename: "CourseEnrollment_aggregate";
  aggregate: AdminCourseList_Course_AppliedAndUnratedCount_aggregate | null;
}

export interface AdminCourseList_Course {
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
  weekDay: Weekday_enum;
  /**
   * A text providing info about the costs of a participation.
   */
  cost: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
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
  language: string | null;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The link to the chat of the course (e.g. a mattermost channel)
   */
  chatLink: string | null;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course
   */
  achievementCertificatePossible: boolean;
  /**
   * Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)
   */
  attendanceCertificatePossible: boolean;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number;
  /**
   * The number of maximum participants in the course.
   */
  maxParticipants: number | null;
  /**
   * An array of texts including the learning goals for the course
   */
  learningGoals: string | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string | null;
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
   * URL to direct users to an appropriate registration page outside of the application. The internal registration is only used if this field is null.
   */
  externalRegistrationLink: string | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * An array relationship
   */
  Sessions: AdminCourseList_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: AdminCourseList_Course_CourseInstructors[];
  /**
   * An array relationship
   */
  CourseLocations: AdminCourseList_Course_CourseLocations[];
  /**
   * An object relationship
   */
  Program: AdminCourseList_Course_Program;
  /**
   * An array relationship
   */
  CourseGroups: AdminCourseList_Course_CourseGroups[];
  /**
   * An array relationship
   */
  DegreeCourses: AdminCourseList_Course_DegreeCourses[];
  /**
   * Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page
   */
  status: CourseStatus_enum;
  /**
   * An array relationship
   */
  CourseEnrollments: AdminCourseList_Course_CourseEnrollments[];
  /**
   * An array relationship
   */
  CourseDegrees: AdminCourseList_Course_CourseDegrees[];
  /**
   * An aggregate relationship
   */
  AppliedAndUnratedCount: AdminCourseList_Course_AppliedAndUnratedCount;
}

export interface AdminCourseList_Course_aggregate_aggregate {
  __typename: "Course_aggregate_fields";
  count: number;
}

export interface AdminCourseList_Course_aggregate {
  __typename: "Course_aggregate";
  aggregate: AdminCourseList_Course_aggregate_aggregate | null;
}

export interface AdminCourseList_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface AdminCourseList {
  /**
   * fetch data from the table: "Course"
   */
  Course: AdminCourseList_Course[];
  /**
   * fetch aggregated fields from the table: "Course"
   */
  Course_aggregate: AdminCourseList_Course_aggregate;
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: AdminCourseList_CourseGroupOption[];
}

export interface AdminCourseListVariables {
  where: Course_bool_exp;
  limit?: number | null;
  offset?: number | null;
}
