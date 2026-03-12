/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: loadParticipationData
// ====================================================

export interface loadParticipationData_loadParticipationData {
  __typename: "LoadParticipationDataResult";
  success: boolean;
  link: string | null;
  error: string | null;
  messageKey: string;
}

export interface loadParticipationData {
  /**
   * loadParticipationData
   */
  loadParticipationData: loadParticipationData_loadParticipationData;
}

export interface loadParticipationDataVariables {
  programId: number;
}
