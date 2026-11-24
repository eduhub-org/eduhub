/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: SessionOnlineLinksFragment
// ====================================================

export interface SessionOnlineLinksFragment_SessionAddresses_OnlineMeetingLink {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
}

export interface SessionOnlineLinksFragment_SessionAddresses_CourseLocation_OnlineMeetingLink {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
}

export interface SessionOnlineLinksFragment_SessionAddresses_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * An object relationship
   */
  OnlineMeetingLink: SessionOnlineLinksFragment_SessionAddresses_CourseLocation_OnlineMeetingLink | null;
}

export interface SessionOnlineLinksFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * An object relationship
   */
  OnlineMeetingLink: SessionOnlineLinksFragment_SessionAddresses_OnlineMeetingLink | null;
  /**
   * An object relationship
   */
  CourseLocation: SessionOnlineLinksFragment_SessionAddresses_CourseLocation | null;
}

export interface SessionOnlineLinksFragment {
  __typename: "Session";
  id: number;
  /**
   * An array relationship
   */
  SessionAddresses: SessionOnlineLinksFragment_SessionAddresses[];
}
