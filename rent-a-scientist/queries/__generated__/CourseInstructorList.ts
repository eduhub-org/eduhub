/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseInstructorList
// ====================================================

export interface CourseInstructorList_CourseInstructor_Expert_User {
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
}

export interface CourseInstructorList_CourseInstructor_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: CourseInstructorList_CourseInstructor_Expert_User;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface CourseInstructorList_CourseInstructor {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: CourseInstructorList_CourseInstructor_Expert;
}

export interface CourseInstructorList {
  /**
   * fetch data from the table: "CourseInstructor"
   */
  CourseInstructor: CourseInstructorList_CourseInstructor[];
}
