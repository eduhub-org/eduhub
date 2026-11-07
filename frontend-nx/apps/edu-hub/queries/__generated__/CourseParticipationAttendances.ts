/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseParticipationAttendances
// ====================================================

export interface CourseParticipationAttendances_Attendance {
  __typename: "Attendance";
  id: number;
  /**
   * The ID of the user for which the attendance was recorded (only provided if the recorded name was in accordance with the name of a user registered for the session)
   */
  userId: any | null;
  /**
   * The ID of the session for which the attendance was recorded
   */
  sessionId: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * The source that provided the recorded names of the attendees.
   */
  source: string;
  /**
   * The day and time the user started to attend the online session or completed the offline registration
   */
  startDateTime: any | null;
  /**
   * The day and time the user left the session. It is not necessarily existing (usually only in only attendance).
   */
  endDateTime: any | null;
  /**
   * If there were interruptions, it is less then the difference of endDateTime and startDateTime.
   */
  totalAttendanceTime: number | null;
  /**
   * The count of the number of interruptions a user had while attending (for online attendance only)
   */
  interruptionCount: number | null;
  /**
   * Location for this attendance. For LimeSurvey attendances, this stores the raw Place value from the QR code (e.g., "Starterkitchen", "Legienstraße 40", "Waterkant", "Kosmos", "KIEL", "HEIDE"). For Zoom attendances, this stores "ZOOM". These values are mapped to LocationOption values (KIEL, HEIDE, ONLINE) when updating CourseEnrollment.location. NULL means location is not yet determined.
   */
  location: string | null;
  /**
   * Identifier from the external attendance source (Zoom, LimeSurvey, ...) that was used for — or was the closest candidate to — matching this Attendance row to the enrolled user. Contains the email when the source provided one, otherwise the recorded display name. NULL only when there was no attendance data at all for the session.
   */
  recordedIdentifier: string | null;
  /**
   * How the Attendance row was matched to the enrolled user. Allowed values: EMAIL (exact, case-insensitive email match against the source), NAME (fuzzy display-name match with score >= 80, also against the cleaned handle), PARTIAL_NAME (a single first name, email local part or initial + last name that fits exactly one participant), NONE (no sufficient match — status will be MISSED; closestCandidates holds the nearest names). A matched Attendance can still be MISSED when the online stay was below the Minimum Attendance Time. NULL for legacy rows and Manual Attendances.
   */
  matchType: string | null;
  /**
   * Fuzzy name score (0-100) of the matched Attendance Record. NULL for EMAIL matches, for Manual Attendances and when nothing was matched.
   */
  matchScore: number | null;
  /**
   * Only for unmatched (matchType NONE) Attendances: the best name candidate per Attendance Location, as [{"location": "ONLINE"|"KIEL"|..., "identifier": "<recorded name>", "score": 0-100}].
   */
  closestCandidates: any | null;
}

export interface CourseParticipationAttendances {
  /**
   * fetch data from the table: "Attendance"
   */
  Attendance: CourseParticipationAttendances_Attendance[];
}

export interface CourseParticipationAttendancesVariables {
  courseId: number;
  userIds: any[];
}
