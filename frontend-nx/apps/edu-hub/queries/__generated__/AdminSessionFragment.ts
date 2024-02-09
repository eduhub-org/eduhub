/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum, SessionAddressType_enum, University_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: AdminSessionFragment
// ====================================================

export interface AdminSessionFragment_SessionAddresses_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
  /**
   * Will be used as default for any new session address.
   */
  defaultSessionAddress: string | null;
}

export interface AdminSessionFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  /**
   * Indicates to which of the existing location options this address is corresponding.
   */
  location: LocationOption_enum | null;
  type: SessionAddressType_enum;
  /**
   * An object relationship
   */
  CourseLocation: AdminSessionFragment_SessionAddresses_CourseLocation | null;
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
  /**
   * The user's email address
   */
  email: string;
}

export interface AdminSessionFragment_SessionSpeakers_Expert {
  __typename: "Expert";
  /**
   * An object relationship
   */
  User: AdminSessionFragment_SessionSpeakers_Expert_User;
  id: number;
}

export interface AdminSessionFragment_SessionSpeakers {
  __typename: "SessionSpeaker";
  /**
   * An object relationship
   */
  Expert: AdminSessionFragment_SessionSpeakers_Expert;
  id: number;
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
