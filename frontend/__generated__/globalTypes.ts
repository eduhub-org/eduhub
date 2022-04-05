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

export enum Employment_enum {
  ACADEMIA = "ACADEMIA",
  EMPLOYED = "EMPLOYED",
  OTHER = "OTHER",
  RETIREE = "RETIREE",
  SELFEMPLOYED = "SELFEMPLOYED",
  STUDENT = "STUDENT",
  UNEMPLOYED = "UNEMPLOYED",
}

export enum MotivationRating_enum {
  DECLINE = "DECLINE",
  INVITE = "INVITE",
  REVIEW = "REVIEW",
  UNRATED = "UNRATED",
}

export enum University_enum {
  CAU_KIEL = "CAU_KIEL",
  DHSH = "DHSH",
  FH_FLENSBURG = "FH_FLENSBURG",
  FH_KIEL = "FH_KIEL",
  FH_WESTKUESTE = "FH_WESTKUESTE",
  MUTHESIUS = "MUTHESIUS",
  OTHER = "OTHER",
  TH_LUEBECK = "TH_LUEBECK",
  UNI_FLENSBURG = "UNI_FLENSBURG",
  UNI_LUEBECK = "UNI_LUEBECK",
}

/**
 * Boolean expression to filter rows from the table "Admin". All fields are combined with a logical 'AND'.
 */
export interface Admin_bool_exp {
  User?: User_bool_exp | null;
  _and?: Admin_bool_exp[] | null;
  _not?: Admin_bool_exp | null;
  _or?: Admin_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "AttendanceSourceData". All fields are combined with a logical 'AND'.
 */
export interface AttendanceSourceData_bool_exp {
  Session?: Session_bool_exp | null;
  URL?: String_comparison_exp | null;
  _and?: AttendanceSourceData_bool_exp[] | null;
  _not?: AttendanceSourceData_bool_exp | null;
  _or?: AttendanceSourceData_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  source?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "AttendanceSource". All fields are combined with a logical 'AND'.
 */
export interface AttendanceSource_bool_exp {
  Attendances?: Attendance_bool_exp | null;
  _and?: AttendanceSource_bool_exp[] | null;
  _not?: AttendanceSource_bool_exp | null;
  _or?: AttendanceSource_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "AttendanceStatus". All fields are combined with a logical 'AND'.
 */
export interface AttendanceStatus_bool_exp {
  Attendances?: Attendance_bool_exp | null;
  _and?: AttendanceStatus_bool_exp[] | null;
  _not?: AttendanceStatus_bool_exp | null;
  _or?: AttendanceStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "AttendanceStatus_enum". All fields are combined with logical 'AND'.
 */
export interface AttendanceStatus_enum_comparison_exp {
  _eq?: AttendanceStatus_enum | null;
  _in?: AttendanceStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: AttendanceStatus_enum | null;
  _nin?: AttendanceStatus_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "Attendance". All fields are combined with a logical 'AND'.
 */
export interface Attendance_bool_exp {
  AttendanceSource?: AttendanceSource_bool_exp | null;
  AttendanceStatus?: AttendanceStatus_bool_exp | null;
  Session?: Session_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: Attendance_bool_exp[] | null;
  _not?: Attendance_bool_exp | null;
  _or?: Attendance_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  endDateTime?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  interruptionCount?: Int_comparison_exp | null;
  recordedName?: String_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  source?: String_comparison_exp | null;
  startDateTime?: timestamptz_comparison_exp | null;
  status?: AttendanceStatus_enum_comparison_exp | null;
  totalAttendanceTime?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'.
 */
export interface Boolean_comparison_exp {
  _eq?: boolean | null;
  _gt?: boolean | null;
  _gte?: boolean | null;
  _in?: boolean[] | null;
  _is_null?: boolean | null;
  _lt?: boolean | null;
  _lte?: boolean | null;
  _neq?: boolean | null;
  _nin?: boolean[] | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollmentStatus". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollmentStatus_bool_exp {
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  _and?: CourseEnrollmentStatus_bool_exp[] | null;
  _not?: CourseEnrollmentStatus_bool_exp | null;
  _or?: CourseEnrollmentStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "CourseEnrollmentStatus_enum". All fields are combined with logical 'AND'.
 */
export interface CourseEnrollmentStatus_enum_comparison_exp {
  _eq?: CourseEnrollmentStatus_enum | null;
  _in?: CourseEnrollmentStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: CourseEnrollmentStatus_enum | null;
  _nin?: CourseEnrollmentStatus_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollment". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollment_bool_exp {
  Course?: Course_bool_exp | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_bool_exp | null;
  MotivationRating?: MotivationRating_bool_exp | null;
  ProjectEnrollments?: ProjectEnrollment_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: CourseEnrollment_bool_exp[] | null;
  _not?: CourseEnrollment_bool_exp | null;
  _or?: CourseEnrollment_bool_exp[] | null;
  achievementCertificateURL?: String_comparison_exp | null;
  attendanceCertificateURL?: String_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  invitationExpirationDate?: date_comparison_exp | null;
  motivationLetter?: String_comparison_exp | null;
  motivationRating?: MotivationRating_enum_comparison_exp | null;
  status?: CourseEnrollmentStatus_enum_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "CourseInstructor". All fields are combined with a logical 'AND'.
 */
export interface CourseInstructor_bool_exp {
  Course?: Course_bool_exp | null;
  Expert?: Expert_bool_exp | null;
  _and?: CourseInstructor_bool_exp[] | null;
  _not?: CourseInstructor_bool_exp | null;
  _or?: CourseInstructor_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  expertId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "CourseLocation". All fields are combined with a logical 'AND'.
 */
export interface CourseLocation_bool_exp {
  Course?: Course_bool_exp | null;
  LocationOption?: LocationOption_bool_exp | null;
  _and?: CourseLocation_bool_exp[] | null;
  _not?: CourseLocation_bool_exp | null;
  _or?: CourseLocation_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  latitude?: String_comparison_exp | null;
  link?: String_comparison_exp | null;
  locationOption?: String_comparison_exp | null;
  longitude?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "CourseProject". All fields are combined with a logical 'AND'.
 */
export interface CourseProject_bool_exp {
  Course?: Course_bool_exp | null;
  Project?: Project_bool_exp | null;
  _and?: CourseProject_bool_exp[] | null;
  _not?: CourseProject_bool_exp | null;
  _or?: CourseProject_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "CourseStatus". All fields are combined with a logical 'AND'.
 */
export interface CourseStatus_bool_exp {
  Courses?: Course_bool_exp | null;
  _and?: CourseStatus_bool_exp[] | null;
  _not?: CourseStatus_bool_exp | null;
  _or?: CourseStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "CourseStatus_enum". All fields are combined with logical 'AND'.
 */
export interface CourseStatus_enum_comparison_exp {
  _eq?: CourseStatus_enum | null;
  _in?: CourseStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: CourseStatus_enum | null;
  _nin?: CourseStatus_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "Course". All fields are combined with a logical 'AND'.
 */
export interface Course_bool_exp {
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  CourseInstructors?: CourseInstructor_bool_exp | null;
  CourseLocations?: CourseLocation_bool_exp | null;
  CourseProjects?: CourseProject_bool_exp | null;
  CourseStatus?: CourseStatus_bool_exp | null;
  Program?: Program_bool_exp | null;
  Sessions?: Session_bool_exp | null;
  _and?: Course_bool_exp[] | null;
  _not?: Course_bool_exp | null;
  _or?: Course_bool_exp[] | null;
  achievementCertificatePossible?: Boolean_comparison_exp | null;
  applicationEnd?: date_comparison_exp | null;
  attendanceCertificatePossible?: Boolean_comparison_exp | null;
  chatLink?: String_comparison_exp | null;
  contentDescriptionField1?: String_comparison_exp | null;
  contentDescriptionField2?: String_comparison_exp | null;
  cost?: String_comparison_exp | null;
  coverImage?: String_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  ects?: String_comparison_exp | null;
  endTime?: timetz_comparison_exp | null;
  headingDescriptionField1?: String_comparison_exp | null;
  headingDescriptionField2?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  language?: String_comparison_exp | null;
  learningGoals?: String_comparison_exp | null;
  maxMissedSessions?: Int_comparison_exp | null;
  programId?: Int_comparison_exp | null;
  startTime?: timetz_comparison_exp | null;
  status?: CourseStatus_enum_comparison_exp | null;
  tagline?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
  visibility?: Boolean_comparison_exp | null;
  weekDay?: String_comparison_exp | null;
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

/**
 * Boolean expression to filter rows from the table "Employment". All fields are combined with a logical 'AND'.
 */
export interface Employment_bool_exp {
  Users?: User_bool_exp | null;
  _and?: Employment_bool_exp[] | null;
  _not?: Employment_bool_exp | null;
  _or?: Employment_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "Employment_enum". All fields are combined with logical 'AND'.
 */
export interface Employment_enum_comparison_exp {
  _eq?: Employment_enum | null;
  _in?: Employment_enum[] | null;
  _is_null?: boolean | null;
  _neq?: Employment_enum | null;
  _nin?: Employment_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "Expert". All fields are combined with a logical 'AND'.
 */
export interface Expert_bool_exp {
  CourseInstructors?: CourseInstructor_bool_exp | null;
  SessionSpeakers?: SessionSpeaker_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: Expert_bool_exp[] | null;
  _not?: Expert_bool_exp | null;
  _or?: Expert_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'.
 */
export interface Int_comparison_exp {
  _eq?: number | null;
  _gt?: number | null;
  _gte?: number | null;
  _in?: number[] | null;
  _is_null?: boolean | null;
  _lt?: number | null;
  _lte?: number | null;
  _neq?: number | null;
  _nin?: number[] | null;
}

/**
 * Boolean expression to filter rows from the table "LocationOption". All fields are combined with a logical 'AND'.
 */
export interface LocationOption_bool_exp {
  Locations?: CourseLocation_bool_exp | null;
  _and?: LocationOption_bool_exp[] | null;
  _not?: LocationOption_bool_exp | null;
  _or?: LocationOption_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "MotivationRating". All fields are combined with a logical 'AND'.
 */
export interface MotivationRating_bool_exp {
  Enrollments?: CourseEnrollment_bool_exp | null;
  _and?: MotivationRating_bool_exp[] | null;
  _not?: MotivationRating_bool_exp | null;
  _or?: MotivationRating_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "MotivationRating_enum". All fields are combined with logical 'AND'.
 */
export interface MotivationRating_enum_comparison_exp {
  _eq?: MotivationRating_enum | null;
  _in?: MotivationRating_enum[] | null;
  _is_null?: boolean | null;
  _neq?: MotivationRating_enum | null;
  _nin?: MotivationRating_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "Program". All fields are combined with a logical 'AND'.
 */
export interface Program_bool_exp {
  Courses?: Course_bool_exp | null;
  _and?: Program_bool_exp[] | null;
  _not?: Program_bool_exp | null;
  _or?: Program_bool_exp[] | null;
  applicationStart?: date_comparison_exp | null;
  attendanceCertificateTemplateURL?: String_comparison_exp | null;
  closingQuestionnaire?: String_comparison_exp | null;
  defaultApplicationEnd?: date_comparison_exp | null;
  defaultMaxMissedSessions?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  lectureEnd?: date_comparison_exp | null;
  lectureStart?: date_comparison_exp | null;
  participationCertificateTemplateURL?: String_comparison_exp | null;
  projectRecordUploadDeadline?: date_comparison_exp | null;
  shortTitle?: String_comparison_exp | null;
  speakerQuestionnaire?: String_comparison_exp | null;
  startQuestionnaire?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  visibility?: Boolean_comparison_exp | null;
  visibilityAchievementCertificate?: Boolean_comparison_exp | null;
  visibilityParticipationCertificate?: Boolean_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectEnrollment". All fields are combined with a logical 'AND'.
 */
export interface ProjectEnrollment_bool_exp {
  Enrollment?: CourseEnrollment_bool_exp | null;
  Project?: Project_bool_exp | null;
  Rating?: ProjectRating_bool_exp | null;
  _and?: ProjectEnrollment_bool_exp[] | null;
  _not?: ProjectEnrollment_bool_exp | null;
  _or?: ProjectEnrollment_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  enrollmentId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  rating?: String_comparison_exp | null;
  recordURL?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectRating". All fields are combined with a logical 'AND'.
 */
export interface ProjectRating_bool_exp {
  ProjectEnrollments?: ProjectEnrollment_bool_exp | null;
  _and?: ProjectRating_bool_exp[] | null;
  _not?: ProjectRating_bool_exp | null;
  _or?: ProjectRating_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectType". All fields are combined with a logical 'AND'.
 */
export interface ProjectType_bool_exp {
  Projects?: Project_bool_exp | null;
  _and?: ProjectType_bool_exp[] | null;
  _not?: ProjectType_bool_exp | null;
  _or?: ProjectType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "Project". All fields are combined with a logical 'AND'.
 */
export interface Project_bool_exp {
  CourseProjects?: CourseProject_bool_exp | null;
  ProjectEnrollments?: ProjectEnrollment_bool_exp | null;
  ProjectType?: ProjectType_bool_exp | null;
  _and?: Project_bool_exp[] | null;
  _not?: Project_bool_exp | null;
  _or?: Project_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "SessionAddress". All fields are combined with a logical 'AND'.
 */
export interface SessionAddress_bool_exp {
  Session?: Session_bool_exp | null;
  _and?: SessionAddress_bool_exp[] | null;
  _not?: SessionAddress_bool_exp | null;
  _or?: SessionAddress_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  latitude?: String_comparison_exp | null;
  link?: String_comparison_exp | null;
  longitude?: String_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "SessionSpeaker". All fields are combined with a logical 'AND'.
 */
export interface SessionSpeaker_bool_exp {
  Expert?: Expert_bool_exp | null;
  Session?: Session_bool_exp | null;
  _and?: SessionSpeaker_bool_exp[] | null;
  _not?: SessionSpeaker_bool_exp | null;
  _or?: SessionSpeaker_bool_exp[] | null;
  createdAt?: timestamptz_comparison_exp | null;
  expertId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to filter rows from the table "Session". All fields are combined with a logical 'AND'.
 */
export interface Session_bool_exp {
  AttendanceDocuments?: AttendanceSourceData_bool_exp | null;
  Attendances?: Attendance_bool_exp | null;
  Course?: Course_bool_exp | null;
  SessionAddresses?: SessionAddress_bool_exp | null;
  SessionSpeakers?: SessionSpeaker_bool_exp | null;
  _and?: Session_bool_exp[] | null;
  _not?: Session_bool_exp | null;
  _or?: Session_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  createdAt?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  endDateTime?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  startDateTime?: timestamptz_comparison_exp | null;
  title?: String_comparison_exp | null;
  updatedAt?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'.
 */
export interface String_comparison_exp {
  _eq?: string | null;
  _gt?: string | null;
  _gte?: string | null;
  _ilike?: string | null;
  _in?: string[] | null;
  _iregex?: string | null;
  _is_null?: boolean | null;
  _like?: string | null;
  _lt?: string | null;
  _lte?: string | null;
  _neq?: string | null;
  _nilike?: string | null;
  _nin?: string[] | null;
  _niregex?: string | null;
  _nlike?: string | null;
  _nregex?: string | null;
  _nsimilar?: string | null;
  _regex?: string | null;
  _similar?: string | null;
}

/**
 * Boolean expression to filter rows from the table "University". All fields are combined with a logical 'AND'.
 */
export interface University_bool_exp {
  Users?: User_bool_exp | null;
  _and?: University_bool_exp[] | null;
  _not?: University_bool_exp | null;
  _or?: University_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "University_enum". All fields are combined with logical 'AND'.
 */
export interface University_enum_comparison_exp {
  _eq?: University_enum | null;
  _in?: University_enum[] | null;
  _is_null?: boolean | null;
  _neq?: University_enum | null;
  _nin?: University_enum[] | null;
}

/**
 * Boolean expression to filter rows from the table "User". All fields are combined with a logical 'AND'.
 */
export interface User_bool_exp {
  Admins?: Admin_bool_exp | null;
  Attendances?: Attendance_bool_exp | null;
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  Experts?: Expert_bool_exp | null;
  _and?: User_bool_exp[] | null;
  _not?: User_bool_exp | null;
  _or?: User_bool_exp[] | null;
  anonymousId?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  email?: String_comparison_exp | null;
  employment?: Employment_enum_comparison_exp | null;
  employmentByEmployment?: Employment_bool_exp | null;
  externalProfile?: String_comparison_exp | null;
  firstName?: String_comparison_exp | null;
  id?: uuid_comparison_exp | null;
  lastName?: String_comparison_exp | null;
  matriculationNumber?: String_comparison_exp | null;
  newsletterRegistration?: Boolean_comparison_exp | null;
  otherUniversity?: String_comparison_exp | null;
  picture?: String_comparison_exp | null;
  university?: University_enum_comparison_exp | null;
  universityByUniversity?: University_bool_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'.
 */
export interface date_comparison_exp {
  _eq?: any | null;
  _gt?: any | null;
  _gte?: any | null;
  _in?: any[] | null;
  _is_null?: boolean | null;
  _lt?: any | null;
  _lte?: any | null;
  _neq?: any | null;
  _nin?: any[] | null;
}

/**
 * Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'.
 */
export interface timestamptz_comparison_exp {
  _eq?: any | null;
  _gt?: any | null;
  _gte?: any | null;
  _in?: any[] | null;
  _is_null?: boolean | null;
  _lt?: any | null;
  _lte?: any | null;
  _neq?: any | null;
  _nin?: any[] | null;
}

/**
 * Boolean expression to compare columns of type "timetz". All fields are combined with logical 'AND'.
 */
export interface timetz_comparison_exp {
  _eq?: any | null;
  _gt?: any | null;
  _gte?: any | null;
  _in?: any[] | null;
  _is_null?: boolean | null;
  _lt?: any | null;
  _lte?: any | null;
  _neq?: any | null;
  _nin?: any[] | null;
}

/**
 * Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'.
 */
export interface uuid_comparison_exp {
  _eq?: any | null;
  _gt?: any | null;
  _gte?: any | null;
  _in?: any[] | null;
  _is_null?: boolean | null;
  _lt?: any | null;
  _lte?: any | null;
  _neq?: any | null;
  _nin?: any[] | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
