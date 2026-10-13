/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEventFromSession
// ====================================================

export interface CreateEventFromSession_insert_Course_one {
  __typename: "Course";
  id: number;
}

export interface CreateEventFromSession {
  /**
   * insert a single row into the table: "Course"
   */
  insert_Course_one: CreateEventFromSession_insert_Course_one | null;
}

export interface CreateEventFromSessionVariables {
  event: Course_insert_input;
}
