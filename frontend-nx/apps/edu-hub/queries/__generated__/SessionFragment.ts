/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SessionAddressType_enum, University_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: SessionFragment
// ====================================================

export interface SessionFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  type: SessionAddressType_enum;
}

export interface SessionFragment_SessionSpeakers_Expert_User {
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
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
}

export interface SessionFragment_SessionSpeakers_Expert {
  __typename: "Expert";
  /**
   * An object relationship
   */
  User: SessionFragment_SessionSpeakers_Expert_User;
}

export interface SessionFragment_SessionSpeakers {
  __typename: "SessionSpeaker";
  /**
   * An object relationship
   */
  Expert: SessionFragment_SessionSpeakers_Expert;
}

export interface SessionFragment {
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
  SessionAddresses: SessionFragment_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: SessionFragment_SessionSpeakers[];
}
