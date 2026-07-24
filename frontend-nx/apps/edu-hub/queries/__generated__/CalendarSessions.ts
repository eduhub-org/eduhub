/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Session_bool_exp, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CalendarSessions
// ====================================================

export interface CalendarSessions_Session_Course_CourseLocations {
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

export interface CalendarSessions_Session_Course_Program {
  __typename: "Program";
  id: number;
  type: string;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface CalendarSessions_Session_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An array relationship
   */
  CourseLocations: CalendarSessions_Session_Course_CourseLocations[];
  /**
   * An object relationship
   */
  Program: CalendarSessions_Session_Course_Program;
}

export interface CalendarSessions_Session_SessionAddresses_CourseLocation {
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

export interface CalendarSessions_Session_SessionAddresses_LocationAddress {
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

export interface CalendarSessions_Session_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  /**
   * An object relationship
   */
  CourseLocation: CalendarSessions_Session_SessionAddresses_CourseLocation | null;
  /**
   * An object relationship
   */
  LocationAddress: CalendarSessions_Session_SessionAddresses_LocationAddress | null;
}

export interface CalendarSessions_Session_SessionSpeakers_User {
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
}

export interface CalendarSessions_Session_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  User: CalendarSessions_Session_SessionSpeakers_User;
}

export interface CalendarSessions_Session {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The title of the session
   */
  title: string;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * An object relationship
   */
  Course: CalendarSessions_Session_Course;
  /**
   * An array relationship
   */
  SessionAddresses: CalendarSessions_Session_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: CalendarSessions_Session_SessionSpeakers[];
}

export interface CalendarSessions {
  /**
   * fetch data from the table: "Session"
   */
  Session: CalendarSessions_Session[];
}

export interface CalendarSessionsVariables {
  where?: Session_bool_exp | null;
  limit?: number | null;
}
