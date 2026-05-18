/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

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
  /**
   * References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.
   */
  defaultSessionAddressId: number | null;
}

export interface AdminSessionFragment_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  /**
   * Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.
   */
  locationAddressId: number | null;
  /**
   * An object relationship
   */
  CourseLocation: AdminSessionFragment_SessionAddresses_CourseLocation | null;
}

export interface AdminSessionFragment_SessionSpeakers_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminSessionFragment_SessionSpeakers_User {
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
   * The user's email address
   */
  email: string;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
  /**
   * The user's country of residence
   */
  country: string | null;
  /**
   * An object relationship
   */
  Organization: AdminSessionFragment_SessionSpeakers_User_Organization | null;
}

export interface AdminSessionFragment_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  User: AdminSessionFragment_SessionSpeakers_User;
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
  isPublicEvent: boolean;
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
  /**
   * JSON string including all recorded participations for the session (also those that were not matched to registered participants)
   */
  attendanceData: string | null;
}
