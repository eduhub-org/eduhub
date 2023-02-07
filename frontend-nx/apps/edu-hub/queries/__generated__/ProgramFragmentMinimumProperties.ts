/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ProgramFragmentMinimumProperties
// ====================================================

export interface ProgramFragmentMinimumProperties {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}
