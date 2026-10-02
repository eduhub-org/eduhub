/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AcceptInstructorConfidentiality
// ====================================================

export interface AcceptInstructorConfidentiality_insert_InstructorConfidentialityAcceptance_one {
  __typename: "InstructorConfidentialityAcceptance";
  id: any;
}

export interface AcceptInstructorConfidentiality {
  /**
   * insert a single row into the table: "InstructorConfidentialityAcceptance"
   */
  insert_InstructorConfidentialityAcceptance_one: AcceptInstructorConfidentiality_insert_InstructorConfidentialityAcceptance_one | null;
}

export interface AcceptInstructorConfidentialityVariables {
  version: string;
}
