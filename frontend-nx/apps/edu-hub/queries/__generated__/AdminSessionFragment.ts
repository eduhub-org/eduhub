/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SessionAddressType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: AdminSessionFragment
// ====================================================

export interface AdminSessionFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  type: SessionAddressType_enum;
}

export interface AdminSessionFragment_SessionSpeakers_Expert_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface AdminSessionFragment_SessionSpeakers_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: AdminSessionFragment_SessionSpeakers_Expert_User;
}

export interface AdminSessionFragment_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  Expert: AdminSessionFragment_SessionSpeakers_Expert;
}

export interface AdminSessionFragment {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The title of the session
   */
  title: string;
  /**
   * An array relationship
   */
  SessionAddresses: AdminSessionFragment_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: AdminSessionFragment_SessionSpeakers[];
}
