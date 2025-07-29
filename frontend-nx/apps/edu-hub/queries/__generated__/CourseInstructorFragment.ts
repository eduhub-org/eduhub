/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CourseInstructorFragment
// ====================================================

export interface CourseInstructorFragment_Expert_User {
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
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The user's email address
   */
  email: string;
}

export interface CourseInstructorFragment_Expert {
  __typename: "Expert";
  id: number;
  /**
   * A short description on the expert's background
   */
  description: string | null;
  /**
   * An object relationship
   */
  User: CourseInstructorFragment_Expert_User;
}

export interface CourseInstructorFragment {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: CourseInstructorFragment_Expert;
}
