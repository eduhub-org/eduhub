/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: EventsCalendarFeed
// ====================================================

export interface EventsCalendarFeed_Course_CourseLocations {
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

export interface EventsCalendarFeed_Course_Sessions_SessionAddresses_CourseLocation {
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

export interface EventsCalendarFeed_Course_Sessions_SessionAddresses {
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
   * Location option of a program session address (course session addresses use courseLocationId instead)
   */
  locationOption: LocationOption_enum | null;
  /**
   * An object relationship
   */
  CourseLocation: EventsCalendarFeed_Course_Sessions_SessionAddresses_CourseLocation | null;
}

export interface EventsCalendarFeed_Course_Sessions {
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
  programId: number | null;
  /**
   * An array relationship
   */
  SessionAddresses: EventsCalendarFeed_Course_Sessions_SessionAddresses[];
}

export interface EventsCalendarFeed_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string | null;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  created_at: any | null;
  updated_at: any | null;
  /**
   * An array relationship
   */
  CourseLocations: EventsCalendarFeed_Course_CourseLocations[];
  /**
   * An array relationship
   */
  Sessions: EventsCalendarFeed_Course_Sessions[];
}

export interface EventsCalendarFeed {
  /**
   * fetch data from the table: "Course"
   */
  Course: EventsCalendarFeed_Course[];
}
