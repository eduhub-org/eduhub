/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyInstructorConfidentialityAcceptance
// ====================================================

export interface MyInstructorConfidentialityAcceptance_InstructorConfidentialityAcceptance {
  __typename: "InstructorConfidentialityAcceptance";
  id: any;
  created_at: any;
}

export interface MyInstructorConfidentialityAcceptance {
  /**
   * fetch data from the table: "InstructorConfidentialityAcceptance"
   */
  InstructorConfidentialityAcceptance: MyInstructorConfidentialityAcceptance_InstructorConfidentialityAcceptance[];
}

export interface MyInstructorConfidentialityAcceptanceVariables {
  userId: any;
  version: string;
}
