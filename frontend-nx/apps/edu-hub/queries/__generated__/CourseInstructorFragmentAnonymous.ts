/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CourseInstructorFragmentAnonymous
// ====================================================

export interface CourseInstructorFragmentAnonymous_Expert_User {
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
}

export interface CourseInstructorFragmentAnonymous_Expert {
  __typename: "Expert";
  id: number;
  /**
   * A short description on the expert's background
   */
  description: string | null;
  /**
   * An object relationship
   */
  User: CourseInstructorFragmentAnonymous_Expert_User;
}

export interface CourseInstructorFragmentAnonymous {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: CourseInstructorFragmentAnonymous_Expert;
}
