/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ExpertNote_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertExpertNote
// ====================================================

export interface InsertExpertNote_insert_ExpertNote_one {
  __typename: "ExpertNote";
  id: number;
}

export interface InsertExpertNote {
  /**
   * insert a single row into the table: "ExpertNote"
   */
  insert_ExpertNote_one: InsertExpertNote_insert_ExpertNote_one | null;
}

export interface InsertExpertNoteVariables {
  object: ExpertNote_insert_input;
}
