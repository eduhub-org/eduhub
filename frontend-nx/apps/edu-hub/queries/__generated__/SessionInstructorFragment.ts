/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: SessionInstructorFragment
// ====================================================

export interface SessionInstructorFragment_SessionAddresses_OnlineMeetingLink {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
}

export interface SessionInstructorFragment_SessionAddresses_CourseLocation_OnlineMeetingLink {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
}

export interface SessionInstructorFragment_SessionAddresses_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * An object relationship
   */
  OnlineMeetingLink: SessionInstructorFragment_SessionAddresses_CourseLocation_OnlineMeetingLink | null;
}

export interface SessionInstructorFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * An object relationship
   */
  OnlineMeetingLink: SessionInstructorFragment_SessionAddresses_OnlineMeetingLink | null;
  /**
   * An object relationship
   */
  CourseLocation: SessionInstructorFragment_SessionAddresses_CourseLocation | null;
}

export interface SessionInstructorFragment {
  __typename: "Session";
  id: number;
  /**
   * JSON string including all recorded participations for the session (also those that were not matched to registered participants)
   */
  attendanceData: string | null;
  /**
   * An array relationship
   */
  SessionAddresses: SessionInstructorFragment_SessionAddresses[];
}
