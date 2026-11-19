/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ExpertFields
// ====================================================

export interface ExpertFields_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ExpertFields_CourseInstructors_Course_Program {
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

export interface ExpertFields_CourseInstructors_Course {
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
  Program: ExpertFields_CourseInstructors_Course_Program;
}

export interface ExpertFields_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertFields_CourseInstructors_Course;
}

export interface ExpertFields_SessionSpeakers_Session_Course_Program {
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

export interface ExpertFields_SessionSpeakers_Session_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: ExpertFields_SessionSpeakers_Session_Course_Program;
}

export interface ExpertFields_SessionSpeakers_Session {
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
  Course: ExpertFields_SessionSpeakers_Session_Course | null;
}

export interface ExpertFields_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  Session: ExpertFields_SessionSpeakers_Session;
}

export interface ExpertFields_ProjectMentors_Project_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertFields_ProjectMentors_Project_ProjectCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * An object relationship
   */
  Program: ExpertFields_ProjectMentors_Project_ProjectCourses_Course_Program;
}

export interface ExpertFields_ProjectMentors_Project_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertFields_ProjectMentors_Project_ProjectCourses_Course;
}

export interface ExpertFields_ProjectMentors_Project {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  created_at: any;
  /**
   * An array relationship
   */
  ProjectCourses: ExpertFields_ProjectMentors_Project_ProjectCourses[];
}

export interface ExpertFields_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  /**
   * An object relationship
   */
  Project: ExpertFields_ProjectMentors_Project;
}

export interface ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
}

export interface ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * An object relationship
   */
  Program: ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course_Program;
}

export interface ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses_Course;
}

export interface ExpertFields_AchievementOptionMentors_AchievementOption {
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
  AchievementOptionCourses: ExpertFields_AchievementOptionMentors_AchievementOption_AchievementOptionCourses[];
}

export interface ExpertFields_AchievementOptionMentors {
  __typename: "AchievementOptionMentor";
  id: number;
  /**
   * An object relationship
   */
  AchievementOption: ExpertFields_AchievementOptionMentors_AchievementOption;
}

export interface ExpertFields_ExpertNotes_Author {
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

export interface ExpertFields_ExpertNotes_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ExpertFields_ExpertNotes {
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
  Author: ExpertFields_ExpertNotes_Author | null;
  /**
   * An object relationship
   */
  Organization: ExpertFields_ExpertNotes_Organization | null;
}

export interface ExpertFields {
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
  Organization: ExpertFields_Organization | null;
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
  CourseInstructors: ExpertFields_CourseInstructors[];
  /**
   * An array relationship
   */
  SessionSpeakers: ExpertFields_SessionSpeakers[];
  /**
   * An array relationship
   */
  ProjectMentors: ExpertFields_ProjectMentors[];
  /**
   * An array relationship
   */
  AchievementOptionMentors: ExpertFields_AchievementOptionMentors[];
  /**
   * An array relationship
   */
  ExpertNotes: ExpertFields_ExpertNotes[];
}
