/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum AttendanceStatus_enum {
  ATTENDED = "ATTENDED",
  MISSED = "MISSED",
  NO_INFO = "NO_INFO",
}

export enum CourseEnrollmentStatus_enum {
  ABORTED = "ABORTED",
  APPLIED = "APPLIED",
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  INVITED = "INVITED",
  REJECTED = "REJECTED",
}

export enum CourseStatus_enum {
  APPLICANTS_INVITED = "APPLICANTS_INVITED",
  DRAFT = "DRAFT",
  PARTICIPANTS_RATED = "PARTICIPANTS_RATED",
  READY_FOR_APPLICATION = "READY_FOR_APPLICATION",
  READY_FOR_PUBLICATION = "READY_FOR_PUBLICATION",
}

/**
 * input type for updating data in table "Course"
 */
export interface Course_set_input {
  achievementCertificatePossible?: boolean | null;
  applicationEnd?: any | null;
  attendanceCertificatePossible?: boolean | null;
  chatLink?: string | null;
  contentDescriptionField1?: string | null;
  contentDescriptionField2?: string | null;
  cost?: string | null;
  coverImage?: string | null;
  createdAt?: any | null;
  ects?: string | null;
  endTime?: any | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  maxMissedSessions?: number | null;
  programId?: number | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  tagline?: string | null;
  title?: string | null;
  updatedAt?: any | null;
  visibility?: boolean | null;
  weekDay?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
