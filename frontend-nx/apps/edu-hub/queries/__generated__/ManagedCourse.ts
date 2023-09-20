/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Weekday_enum, SessionAddressType_enum, University_enum, LocationOption_enum, CourseStatus_enum, CourseEnrollmentStatus_enum, MotivationRating_enum, AttendanceStatus_enum, AchievementRecordRating_enum, AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourse
// ====================================================

export interface ManagedCourse_Course_by_pk_Sessions_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  type: SessionAddressType_enum;
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
  /**
   * The user's email address
   */
  email: string;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert {
  __typename: "Expert";
  /**
   * An object relationship
   */
  User: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert_User;
  id: number;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers {
  __typename: "SessionSpeaker";
  /**
   * An object relationship
   */
  Expert: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_Expert;
  id: number;
}

export interface ManagedCourse_Course_by_pk_Sessions {
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
  SessionAddresses: ManagedCourse_Course_by_pk_Sessions_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers[];
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

export interface ManagedCourse_Course_by_pk_CourseLocations {
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
}

export interface ManagedCourse_Course_by_pk_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface ManagedCourse_Course_by_pk_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  /**
   * An object relationship
   */
  CourseGroupOption: ManagedCourse_Course_by_pk_CourseGroups_CourseGroupOption;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses_Course {
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
  Program: ManagedCourse_Course_by_pk_DegreeCourses_Course_Program;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses {
  __typename: "CourseDegree";
  id: number;
  /**
   * ID of the course which is assigned to a degree
   */
  courseId: number;
  /**
   * An object relationship
   */
  Course: ManagedCourse_Course_by_pk_DegreeCourses_Course;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User_Attendances_Session {
  __typename: "Session";
  id: number;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User_Attendances {
  __typename: "Attendance";
  id: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * An object relationship
   */
  Session: ManagedCourse_Course_by_pk_CourseEnrollments_User_Attendances_Session;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program {
  __typename: "Program";
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments {
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
   * An object relationship
   */
  Course: ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course;
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments_User {
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
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
  /**
   * An array relationship
   */
  Attendances: ManagedCourse_Course_by_pk_CourseEnrollments_User_Attendances[];
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments_User_CourseEnrollments[];
}

export interface ManagedCourse_Course_by_pk_CourseEnrollments {
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
  User: ManagedCourse_Course_by_pk_CourseEnrollments_User;
}

export interface ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors {
  __typename: "AchievementRecordAuthor";
  /**
   * ID of a user that is author of an uploaded achievement record
   */
  userId: any;
}

export interface ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords {
  __typename: "AchievementRecord";
  id: number;
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
   * An array relationship
   */
  AchievementRecordAuthors: ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords_AchievementRecordAuthors[];
}

export interface ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption {
  __typename: "AchievementOption";
  /**
   * An array relationship
   */
  AchievementRecords: ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords[];
  /**
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
}

export interface ManagedCourse_Course_by_pk_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  /**
   * An object relationship
   */
  AchievementOption: ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption;
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
  Sessions: ManagedCourse_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: ManagedCourse_Course_by_pk_CourseInstructors[];
  /**
   * An array relationship
   */
  CourseLocations: ManagedCourse_Course_by_pk_CourseLocations[];
  /**
   * An object relationship
   */
  Program: ManagedCourse_Course_by_pk_Program;
  /**
   * An array relationship
   */
  CourseGroups: ManagedCourse_Course_by_pk_CourseGroups[];
  /**
   * An array relationship
   */
  DegreeCourses: ManagedCourse_Course_by_pk_DegreeCourses[];
  /**
   * Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page
   */
  status: CourseStatus_enum;
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourse_Course_by_pk_CourseEnrollments[];
  /**
   * An array relationship
   */
  AchievementOptionCourses: ManagedCourse_Course_by_pk_AchievementOptionCourses[];
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
