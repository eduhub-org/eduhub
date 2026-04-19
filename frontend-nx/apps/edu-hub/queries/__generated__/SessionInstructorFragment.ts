/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: SessionInstructorFragment
// ====================================================

export interface SessionInstructorFragment {
  __typename: "Session";
  id: number;
  /**
   * JSON string including all recorded participations for the session (also those that were not matched to registered participants)
   */
  attendanceData: string | null;
}
