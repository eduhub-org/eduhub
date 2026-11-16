/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectCoursesByCourse
// ====================================================

export interface ProjectCoursesByCourse_Project_courses {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface ProjectCoursesByCourse_Project {
  __typename: "Project";
  id: number;
  /**
   * Every course the project is listed in, including courses whose listings the caller cannot see.
   */
  courses: ProjectCoursesByCourse_Project_courses[] | null;
}

export interface ProjectCoursesByCourse {
  /**
   * fetch data from the table: "Project"
   */
  Project: ProjectCoursesByCourse_Project[];
}

export interface ProjectCoursesByCourseVariables {
  courseId: number;
}
