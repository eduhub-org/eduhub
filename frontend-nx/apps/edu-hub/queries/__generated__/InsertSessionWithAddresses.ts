/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SessionAddress_insert_input, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertSessionWithAddresses
// ====================================================

export interface InsertSessionWithAddresses_insert_Session_returning_SessionAddresses {
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
  /**
   * Provide the id of the course location the address is referring to If the address is part of a course itThe id of a course.
   */
  courseLocationId: number | null;
}

export interface InsertSessionWithAddresses_insert_Session_returning {
  __typename: "Session";
  id: number;
  /**
   * An array relationship
   */
  SessionAddresses: InsertSessionWithAddresses_insert_Session_returning_SessionAddresses[];
}

export interface InsertSessionWithAddresses_insert_Session {
  __typename: "Session_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertSessionWithAddresses_insert_Session_returning[];
}

export interface InsertSessionWithAddresses {
  /**
   * insert data into the table: "Session"
   */
  insert_Session: InsertSessionWithAddresses_insert_Session | null;
}

export interface InsertSessionWithAddressesVariables {
  courseId: number;
  startTime: any;
  endTime: any;
  sessionAddresses: SessionAddress_insert_input[];
}
