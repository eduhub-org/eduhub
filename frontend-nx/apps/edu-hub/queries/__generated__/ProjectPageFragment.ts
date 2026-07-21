/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: ProjectPageFragment
// ====================================================

export interface ProjectPageFragment_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ProjectPageFragment_ProjectMentors_User {
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

export interface ProjectPageFragment_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  /**
   * An object relationship
   */
  User: ProjectPageFragment_ProjectMentors_User;
}

export interface ProjectPageFragment_ProjectAuthors_User {
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

export interface ProjectPageFragment_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  /**
   * An object relationship
   */
  User: ProjectPageFragment_ProjectAuthors_User;
}

export interface ProjectPageFragment_ProjectBadges_Badge {
  __typename: "Badge";
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
}

export interface ProjectPageFragment_ProjectBadges {
  __typename: "ProjectBadge";
  id: number;
  /**
   * An object relationship
   */
  Badge: ProjectPageFragment_ProjectBadges_Badge;
}

export interface ProjectPageFragment_ProjectCourses_Course_Program {
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
  type: string;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
  /**
   * The day the application for all courses of the program start.
   */
  applicationStart: any | null;
  /**
   * The default application deadline for a course. It can be changed on the course level.
   */
  defaultApplicationEnd: any | null;
}

export interface ProjectPageFragment_ProjectCourses_Course_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  groupOptionId: number;
}

export interface ProjectPageFragment_ProjectCourses_Course {
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
  Program: ProjectPageFragment_ProjectCourses_Course_Program;
  /**
   * An array relationship
   */
  CourseGroups: ProjectPageFragment_ProjectCourses_Course_CourseGroups[];
}

export interface ProjectPageFragment_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  courseId: number;
  /**
   * An object relationship
   */
  Course: ProjectPageFragment_ProjectCourses_Course;
}

export interface ProjectPageFragment {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  status: ProjectStatus_enum;
  /**
   * Showcase visibility flag: true means the project is publicly published (home sliders, public showcase). Orthogonal to lifecycle, which stays in "status".
   */
  published: boolean;
  /**
   * FK to ProjectType.value. Required with documentationInstructionId before leaving PROPOSED (check constraint). Drives mandatory deliverables and workflow (e.g. ONLINE_COURSE template claim may insert ONGOING directly).
   */
  type: string | null;
  acceptingParticipants: boolean;
  organizationId: number | null;
  documentationUrl: string | null;
  presentationUrl: string | null;
  externalUrl: string | null;
  /**
   * Optional per-project submission deadline. When null, the effective deadline is taken from the course (projectSubmissionDeadline) or program defaults.
   */
  submissionDeadline: any | null;
  /**
   * Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.
   */
  submittedAt: any | null;
  /**
   * An object relationship
   */
  Organization: ProjectPageFragment_Organization | null;
  /**
   * An array relationship
   */
  ProjectMentors: ProjectPageFragment_ProjectMentors[];
  /**
   * An array relationship
   */
  ProjectAuthors: ProjectPageFragment_ProjectAuthors[];
  /**
   * An array relationship
   */
  ProjectBadges: ProjectPageFragment_ProjectBadges[];
  /**
   * An array relationship
   */
  ProjectCourses: ProjectPageFragment_ProjectCourses[];
}
