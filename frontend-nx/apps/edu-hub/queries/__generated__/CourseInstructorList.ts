/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { University_enum } from "./../../__generated__/globalTypes";

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
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
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
