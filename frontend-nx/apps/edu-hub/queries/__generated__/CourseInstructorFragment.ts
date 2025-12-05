/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CourseInstructorFragment
// ====================================================

export interface CourseInstructorFragment_User {
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

export interface CourseInstructorFragment {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  User: CourseInstructorFragment_User;
}
