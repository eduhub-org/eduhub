/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProgramInstructorEmails
// ====================================================

export interface ProgramInstructorEmails_Course_CourseInstructors_User {
  __typename: "User";
  id: any;
  /**
   * The user's email address
   */
  email: string;
}

export interface ProgramInstructorEmails_Course_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  User: ProgramInstructorEmails_Course_CourseInstructors_User;
}

export interface ProgramInstructorEmails_Course {
  __typename: "Course";
  id: number;
  /**
   * An array relationship
   */
  CourseInstructors: ProgramInstructorEmails_Course_CourseInstructors[];
}

export interface ProgramInstructorEmails {
  /**
   * fetch data from the table: "Course"
   */
  Course: ProgramInstructorEmails_Course[];
}

export interface ProgramInstructorEmailsVariables {
  programId: number;
}
