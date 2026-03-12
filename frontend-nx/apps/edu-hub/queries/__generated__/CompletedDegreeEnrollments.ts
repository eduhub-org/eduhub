/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CompletedDegreeEnrollments
// ====================================================

export interface CompletedDegreeEnrollments_CourseEnrollment_Course_Program {
  __typename: "Program";
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
}

export interface CompletedDegreeEnrollments_CourseEnrollment_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * An object relationship
   */
  Program: CompletedDegreeEnrollments_CourseEnrollment_Course_Program;
}

export interface CompletedDegreeEnrollments_CourseEnrollment {
  __typename: "CourseEnrollment";
  /**
   * An object relationship
   */
  Course: CompletedDegreeEnrollments_CourseEnrollment_Course;
}

export interface CompletedDegreeEnrollments {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: CompletedDegreeEnrollments_CourseEnrollment[];
}

export interface CompletedDegreeEnrollmentsVariables {
  degreeCourseId: number;
  userId: any;
}
