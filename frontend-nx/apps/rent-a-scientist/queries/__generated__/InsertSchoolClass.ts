/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SchoolClass_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertSchoolClass
// ====================================================

export interface InsertSchoolClass_insert_SchoolClass_one {
  __typename: "SchoolClass";
  id: number;
}

export interface InsertSchoolClass {
  /**
   * insert a single row into the table: "SchoolClass"
   */
  insert_SchoolClass_one: InsertSchoolClass_insert_SchoolClass_one | null;
}

export interface InsertSchoolClassVariables {
  input: SchoolClass_insert_input;
}
