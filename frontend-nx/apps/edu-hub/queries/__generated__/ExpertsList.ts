/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, User_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ExpertsList
// ====================================================

export interface ExpertsList_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ExpertsList_User_CourseInstructors_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  type: string;
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertsList_User_CourseInstructors_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * An object relationship
   */
  Program: ExpertsList_User_CourseInstructors_Course_Program;
}

export interface ExpertsList_User_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertsList_User_CourseInstructors_Course;
}

export interface ExpertsList_User_SessionSpeakers_Session_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertsList_User_SessionSpeakers_Session_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: ExpertsList_User_SessionSpeakers_Session_Course_Program;
}

export interface ExpertsList_User_SessionSpeakers_Session {
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
   * An object relationship
   */
  Course: ExpertsList_User_SessionSpeakers_Session_Course | null;
}

export interface ExpertsList_User_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  Session: ExpertsList_User_SessionSpeakers_Session;
}

export interface ExpertsList_User_ProjectMentors_Project_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertsList_User_ProjectMentors_Project_ProjectCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * An object relationship
   */
  Program: ExpertsList_User_ProjectMentors_Project_ProjectCourses_Course_Program;
}

export interface ExpertsList_User_ProjectMentors_Project_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertsList_User_ProjectMentors_Project_ProjectCourses_Course;
}

export interface ExpertsList_User_ProjectMentors_Project {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  created_at: any;
  /**
   * An array relationship
   */
  ProjectCourses: ExpertsList_User_ProjectMentors_Project_ProjectCourses[];
}

export interface ExpertsList_User_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  /**
   * An object relationship
   */
  Project: ExpertsList_User_ProjectMentors_Project;
}

export interface ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * An object relationship
   */
  Program: ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course_Program;
}

export interface ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course;
}

export interface ExpertsList_User_AchievementOptionMentors_AchievementOption {
  __typename: "AchievementOption";
  id: number;
  /**
   * Title of an offered achievement option
   */
  title: string;
  /**
   * Description of an offered achievement option
   */
  description: string | null;
  created_at: any | null;
  /**
   * An array relationship
   */
  AchievementOptionCourses: ExpertsList_User_AchievementOptionMentors_AchievementOption_AchievementOptionCourses[];
}

export interface ExpertsList_User_AchievementOptionMentors {
  __typename: "AchievementOptionMentor";
  id: number;
  /**
   * An object relationship
   */
  AchievementOption: ExpertsList_User_AchievementOptionMentors_AchievementOption;
}

export interface ExpertsList_User_ExpertNotes_Author {
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

export interface ExpertsList_User_ExpertNotes_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ExpertsList_User_ExpertNotes {
  __typename: "ExpertNote";
  id: number;
  text: string;
  created_at: any;
  updated_at: any;
  authorId: any | null;
  organizationId: number | null;
  /**
   * An object relationship
   */
  Author: ExpertsList_User_ExpertNotes_Author | null;
  /**
   * An object relationship
   */
  Organization: ExpertsList_User_ExpertNotes_Organization | null;
}

export interface ExpertsList_User {
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
   * Free-text organization the user belongs to, e.g. entered during guest registration. Used when no organizationId is set.
   */
  organizationName: string | null;
  /**
   * An object relationship
   */
  Organization: ExpertsList_User_Organization | null;
  /**
   * Immutable Matrix user handle, set once from Keycloak. Format: firstname.lastname.uuid6
   */
  matrixUserHandle: string | null;
  /**
   * The person objected to being contacted about new formats (Art. 21 GDPR). Set by admins and the org admins of their courses, removed only by admins.
   */
  doNotContact: boolean;
  /**
   * A computed field, executes function "user_expert_last_active_at"
   */
  expertLastActiveAt: any | null;
  /**
   * An array relationship
   */
  CourseInstructors: ExpertsList_User_CourseInstructors[];
  /**
   * An array relationship
   */
  SessionSpeakers: ExpertsList_User_SessionSpeakers[];
  /**
   * An array relationship
   */
  ProjectMentors: ExpertsList_User_ProjectMentors[];
  /**
   * An array relationship
   */
  AchievementOptionMentors: ExpertsList_User_AchievementOptionMentors[];
  /**
   * An array relationship
   */
  ExpertNotes: ExpertsList_User_ExpertNotes[];
}

export interface ExpertsList_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface ExpertsList_User_aggregate {
  __typename: "User_aggregate";
  aggregate: ExpertsList_User_aggregate_aggregate | null;
}

export interface ExpertsList {
  /**
   * fetch data from the table: "User"
   */
  User: ExpertsList_User[];
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: ExpertsList_User_aggregate;
}

export interface ExpertsListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: User_bool_exp | null;
  scope?: User_bool_exp | null;
  isAdmin: boolean;
  order_by?: User_order_by[] | null;
}
