/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: PublicEventById
// ====================================================

export interface PublicEventById_Session_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface PublicEventById_Session_Course_CourseLocations {
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

export interface PublicEventById_Session_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * An object relationship
   */
  Program: PublicEventById_Session_Course_Program;
  /**
   * An array relationship
   */
  CourseLocations: PublicEventById_Session_Course_CourseLocations[];
}

export interface PublicEventById_Session_SessionAddresses_CourseLocation {
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

export interface PublicEventById_Session_SessionAddresses_LocationAddress {
  __typename: "LocationAddress";
  id: number;
  /**
   * Concise label shown in lists and typeahead (e.g., "Room 2.12", "Main Building").
   */
  shortLabel: string;
  /**
   * Full human-readable address (street, building, room number, etc.).
   */
  address: string;
}

export interface PublicEventById_Session_SessionAddresses {
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
  CourseLocation: PublicEventById_Session_SessionAddresses_CourseLocation | null;
  /**
   * An object relationship
   */
  LocationAddress: PublicEventById_Session_SessionAddresses_LocationAddress | null;
}

export interface PublicEventById_Session_SessionSpeakers_User {
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
}

export interface PublicEventById_Session_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  User: PublicEventById_Session_SessionSpeakers_User;
}

export interface PublicEventById_Session {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  isPublicEvent: boolean;
  /**
   * An object relationship
   */
  Course: PublicEventById_Session_Course;
  /**
   * An array relationship
   */
  SessionAddresses: PublicEventById_Session_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: PublicEventById_Session_SessionSpeakers[];
}

export interface PublicEventById {
  /**
   * fetch data from the table: "Session"
   */
  Session: PublicEventById_Session[];
}

export interface PublicEventByIdVariables {
  sessionId: number;
}
