/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: HomeProjectTilesAll
// ====================================================

export interface HomeProjectTilesAll_Project_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface HomeProjectTilesAll_Project_ProjectMentors_User {
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
}

export interface HomeProjectTilesAll_Project_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  /**
   * An object relationship
   */
  User: HomeProjectTilesAll_Project_ProjectMentors_User;
}

export interface HomeProjectTilesAll_Project_ProjectAuthors_User {
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
}

export interface HomeProjectTilesAll_Project_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  /**
   * An object relationship
   */
  User: HomeProjectTilesAll_Project_ProjectAuthors_User;
}

export interface HomeProjectTilesAll_Project_ProjectBadges_Badge {
  __typename: "Badge";
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
}

export interface HomeProjectTilesAll_Project_ProjectBadges {
  __typename: "ProjectBadge";
  id: number;
  /**
   * An object relationship
   */
  Badge: HomeProjectTilesAll_Project_ProjectBadges_Badge;
}

export interface HomeProjectTilesAll_Project_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
  type: string;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
}

export interface HomeProjectTilesAll_Project_ProjectCourses_Course_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  order: number;
}

export interface HomeProjectTilesAll_Project_ProjectCourses_Course_CourseGroups {
  __typename: "CourseGroup";
  /**
   * An object relationship
   */
  CourseGroupOption: HomeProjectTilesAll_Project_ProjectCourses_Course_CourseGroups_CourseGroupOption;
}

export interface HomeProjectTilesAll_Project_ProjectCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * An object relationship
   */
  Program: HomeProjectTilesAll_Project_ProjectCourses_Course_Program;
  /**
   * An array relationship
   */
  CourseGroups: HomeProjectTilesAll_Project_ProjectCourses_Course_CourseGroups[];
}

export interface HomeProjectTilesAll_Project_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  courseId: number;
  /**
   * An object relationship
   */
  Course: HomeProjectTilesAll_Project_ProjectCourses_Course;
}

export interface HomeProjectTilesAll_Project {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  coverImageUrl: string | null;
  status: ProjectStatus_enum;
  /**
   * Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.
   */
  submittedAt: any | null;
  acceptingParticipants: boolean;
  organizationId: number | null;
  /**
   * An object relationship
   */
  Organization: HomeProjectTilesAll_Project_Organization | null;
  /**
   * An array relationship
   */
  ProjectMentors: HomeProjectTilesAll_Project_ProjectMentors[];
  /**
   * An array relationship
   */
  ProjectAuthors: HomeProjectTilesAll_Project_ProjectAuthors[];
  /**
   * An array relationship
   */
  ProjectBadges: HomeProjectTilesAll_Project_ProjectBadges[];
  /**
   * An array relationship
   */
  ProjectCourses: HomeProjectTilesAll_Project_ProjectCourses[];
}

export interface HomeProjectTilesAll {
  /**
   * fetch data from the table: "Project"
   */
  Project: HomeProjectTilesAll_Project[];
}

export interface HomeProjectTilesAllVariables {
  limit?: number | null;
  offset?: number | null;
}
