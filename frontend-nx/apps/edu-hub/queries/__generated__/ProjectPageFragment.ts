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
  firstName: string;
  lastName: string;
  picture: string | null;
}

export interface ProjectPageFragment_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  User: ProjectPageFragment_ProjectMentors_User;
}

export interface ProjectPageFragment_ProjectAuthors_User {
  __typename: "User";
  id: any;
  firstName: string;
  lastName: string;
  picture: string | null;
}

export interface ProjectPageFragment_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  User: ProjectPageFragment_ProjectAuthors_User;
}

export interface ProjectPageFragment_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  title: string;
  shortTitle: string | null;
  type: string;
  published: boolean;
  lectureStart: any | null;
  lectureEnd: any | null;
  applicationStart: any | null;
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
  title: string;
  applicationEnd: any;
  Program: ProjectPageFragment_ProjectCourses_Course_Program;
  CourseGroups: ProjectPageFragment_ProjectCourses_Course_CourseGroups[];
}

export interface ProjectPageFragment_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  courseId: number;
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
  type: string | null;
  acceptingParticipants: boolean;
  organizationId: number | null;
  documentationUrl: string | null;
  presentationUrl: string | null;
  externalUrl: string | null;
  submissionDeadline: any | null;
  Organization: ProjectPageFragment_Organization | null;
  ProjectMentors: ProjectPageFragment_ProjectMentors[];
  ProjectAuthors: ProjectPageFragment_ProjectAuthors[];
  ProjectCourses: ProjectPageFragment_ProjectCourses[];
}
