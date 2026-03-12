/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: SessionAddressesByLocationAddressId
// ====================================================

export interface SessionAddressesByLocationAddressId_SessionAddress_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
}

export interface SessionAddressesByLocationAddressId_SessionAddress {
  __typename: "SessionAddress";
  id: number;
  /**
   * Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.
   */
  locationAddressId: number | null;
  /**
   * Provide the id of the course location the address is referring to If the address is part of a course itThe id of a course.
   */
  courseLocationId: number | null;
  /**
   * An object relationship
   */
  CourseLocation: SessionAddressesByLocationAddressId_SessionAddress_CourseLocation | null;
}

export interface SessionAddressesByLocationAddressId {
  /**
   * fetch data from the table: "SessionAddress"
   */
  SessionAddress: SessionAddressesByLocationAddressId_SessionAddress[];
}

export interface SessionAddressesByLocationAddressIdVariables {
  locationAddressIds: number[];
}
