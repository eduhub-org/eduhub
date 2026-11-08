/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: SessionAttendances
// ====================================================

export interface SessionAttendances_Attendance_User {
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

export interface SessionAttendances_Attendance {
  __typename: "Attendance";
  id: number;
  /**
   * The ID of the user for which the attendance was recorded (only provided if the recorded name was in accordance with the name of a user registered for the session)
   */
  userId: any | null;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * The source that provided the recorded names of the attendees.
   */
  source: string;
  /**
   * Location for this attendance. For LimeSurvey attendances, this stores the raw Place value from the QR code (e.g., "Starterkitchen", "Legienstraße 40", "Waterkant", "Kosmos", "KIEL", "HEIDE"). For Zoom attendances, this stores "ZOOM". These values are mapped to LocationOption values (KIEL, HEIDE, ONLINE) when updating CourseEnrollment.location. NULL means location is not yet determined.
   */
  location: string | null;
  /**
   * Key of the matched Attendance Record in Session.attendanceData (the pandas row index). NULL when nothing was matched. Each Attendance Record is matched to at most one Attendance.
   */
  attendanceRecordIndex: number | null;
  /**
   * Identifier from the external attendance source (Zoom, LimeSurvey, ...) that was used for — or was the closest candidate to — matching this Attendance row to the enrolled user. Contains the email when the source provided one, otherwise the recorded display name. NULL only when there was no attendance data at all for the session.
   */
  recordedIdentifier: string | null;
  /**
   * How the Attendance row was matched to the enrolled user. Allowed values: EMAIL (exact, case-insensitive email match against the source), NAME (fuzzy display-name match with score >= 80, also against the cleaned handle), PARTIAL_NAME (a single first name, email local part or initial + last name that fits exactly one participant), NONE (no sufficient match — status will be MISSED; closestCandidates holds the nearest names). A matched Attendance can still be MISSED when the online stay was below the Minimum Attendance Time. NULL for legacy rows and Manual Attendances.
   */
  matchType: string | null;
  /**
   * An object relationship
   */
  User: SessionAttendances_Attendance_User | null;
}

export interface SessionAttendances_Participants {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
}

export interface SessionAttendances {
  /**
   * fetch data from the table: "Attendance"
   */
  Attendance: SessionAttendances_Attendance[];
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  Participants: SessionAttendances_Participants[];
}

export interface SessionAttendancesVariables {
  sessionId: number;
}
