/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProgramSessions
// ====================================================

export interface ProgramSessions_Session_SessionAddresses {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
  /**
   * Location option of a program session address (course session addresses use courseLocationId instead)
   */
  locationOption: LocationOption_enum | null;
  /**
   * Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.
   */
  locationAddressId: number | null;
}

export interface ProgramSessions_Session {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * If false, attendance is tracked but does not count toward passing (maxMissedSessions) or certificates
   */
  isMandatory: boolean;
  /**
   * Set for program-wide sessions (courseId is then NULL); shown in every course of the program
   */
  programId: number | null;
  /**
   * An array relationship
   */
  SessionAddresses: ProgramSessions_Session_SessionAddresses[];
}

export interface ProgramSessions {
  /**
   * fetch data from the table: "Session"
   */
  Session: ProgramSessions_Session[];
}

export interface ProgramSessionsVariables {
  programId: number;
}
