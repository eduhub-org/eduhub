/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SchoolClassRequest_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAssignments
// ====================================================

export interface UpdateAssignments_insert_SchoolClassRequest_returning {
  __typename: "SchoolClassRequest";
  id: number;
}

export interface UpdateAssignments_insert_SchoolClassRequest {
  __typename: "SchoolClassRequest_mutation_response";
  /**
   * data from the rows affected by the mutation
   */
  returning: UpdateAssignments_insert_SchoolClassRequest_returning[];
}

export interface UpdateAssignments {
  /**
   * insert data into the table: "SchoolClassRequest"
   */
  insert_SchoolClassRequest: UpdateAssignments_insert_SchoolClassRequest | null;
}

export interface UpdateAssignmentsVariables {
  objects: SchoolClassRequest_insert_input[];
}
