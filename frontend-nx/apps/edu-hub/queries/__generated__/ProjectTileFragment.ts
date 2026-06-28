/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: ProjectTileFragment
// ====================================================

export interface ProjectTileFragment_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ProjectTileFragment_ProjectMentors_User {
  __typename: "User";
  id: any;
  firstName: string;
  lastName: string;
  picture: string | null;
}

export interface ProjectTileFragment_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  User: ProjectTileFragment_ProjectMentors_User;
}

export interface ProjectTileFragment_ProjectAuthors_User {
  __typename: "User";
  id: any;
  firstName: string;
  lastName: string;
  picture: string | null;
}

export interface ProjectTileFragment_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  User: ProjectTileFragment_ProjectAuthors_User;
}

export interface ProjectTileFragment_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  shortTitle: string | null;
  title: string;
  type: string;
  published: boolean;
  lectureEnd: any | null;
}

export interface ProjectTileFragment_ProjectCourses_Course {
  __typename: "Course";
  id: number;
  title: string;
  applicationEnd: any;
  Program: ProjectTileFragment_ProjectCourses_Course_Program;
}

export interface ProjectTileFragment_ProjectCourses {
  __typename: "ProjectCourse";
  id: number;
  courseId: number;
  Course: ProjectTileFragment_ProjectCourses_Course;
}

export interface ProjectTileFragment {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  coverImageUrl: string | null;
  status: ProjectStatus_enum;
  acceptingParticipants: boolean;
  organizationId: number | null;
  Organization: ProjectTileFragment_Organization | null;
  ProjectMentors: ProjectTileFragment_ProjectMentors[];
  ProjectAuthors: ProjectTileFragment_ProjectAuthors[];
  ProjectCourses: ProjectTileFragment_ProjectCourses[];
}
