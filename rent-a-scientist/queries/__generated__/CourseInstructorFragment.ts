/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CourseInstructorFragment
// ====================================================

export interface CourseInstructorFragment_Expert_User {
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

export interface CourseInstructorFragment_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: CourseInstructorFragment_Expert_User;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface CourseInstructorFragment {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: CourseInstructorFragment_Expert;
}
