/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * unique or primary key constraints on table "Admin"
 */
export enum Admin_constraint {
  Admin_pkey = "Admin_pkey",
}

/**
 * update columns of table "Admin"
 */
export enum Admin_update_column {
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "AttendanceSourceData"
 */
export enum AttendanceSourceData_constraint {
  AttendenceDocument_pkey = "AttendenceDocument_pkey",
}

/**
 * update columns of table "AttendanceSourceData"
 */
export enum AttendanceSourceData_update_column {
  URL = "URL",
  created_at = "created_at",
  id = "id",
  sessionId = "sessionId",
  source = "source",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "AttendanceSource"
 */
export enum AttendanceSource_constraint {
  AttendanceSource_pkey = "AttendanceSource_pkey",
}

/**
 * update columns of table "AttendanceSource"
 */
export enum AttendanceSource_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "AttendanceStatus"
 */
export enum AttendanceStatus_constraint {
  AttendanceStatus_pkey = "AttendanceStatus_pkey",
}

export enum AttendanceStatus_enum {
  ATTENDED = "ATTENDED",
  MISSED = "MISSED",
  NO_INFO = "NO_INFO",
}

/**
 * update columns of table "AttendanceStatus"
 */
export enum AttendanceStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Attendance"
 */
export enum Attendance_constraint {
  Attendence_pkey = "Attendence_pkey",
}

/**
 * update columns of table "Attendance"
 */
export enum Attendance_update_column {
  created_at = "created_at",
  endDateTime = "endDateTime",
  id = "id",
  interruptionCount = "interruptionCount",
  recordedName = "recordedName",
  sessionId = "sessionId",
  source = "source",
  startDateTime = "startDateTime",
  status = "status",
  totalAttendanceTime = "totalAttendanceTime",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "CourseEnrollmentStatus"
 */
export enum CourseEnrollmentStatus_constraint {
  EnrollmentStatus_pkey = "EnrollmentStatus_pkey",
}

export enum CourseEnrollmentStatus_enum {
  ABORTED = "ABORTED",
  APPLIED = "APPLIED",
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  INVITED = "INVITED",
  REJECTED = "REJECTED",
}

/**
 * update columns of table "CourseEnrollmentStatus"
 */
export enum CourseEnrollmentStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "CourseEnrollment"
 */
export enum CourseEnrollment_constraint {
  Enrollment_pkey = "Enrollment_pkey",
}

/**
 * update columns of table "CourseEnrollment"
 */
export enum CourseEnrollment_update_column {
  achievementCertificateURL = "achievementCertificateURL",
  attendanceCertificateURL = "attendanceCertificateURL",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  invitationExpirationDate = "invitationExpirationDate",
  motivationLetter = "motivationLetter",
  motivationRating = "motivationRating",
  status = "status",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "CourseInstructor"
 */
export enum CourseInstructor_constraint {
  CourseInstructor_pkey = "CourseInstructor_pkey",
}

/**
 * update columns of table "CourseInstructor"
 */
export enum CourseInstructor_update_column {
  courseId = "courseId",
  created_at = "created_at",
  expertId = "expertId",
  id = "id",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseLocation"
 */
export enum CourseLocation_constraint {
  CourseAddress_pkey = "CourseAddress_pkey",
}

/**
 * update columns of table "CourseLocation"
 */
export enum CourseLocation_update_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  latitude = "latitude",
  link = "link",
  locationOption = "locationOption",
  longitude = "longitude",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseProject"
 */
export enum CourseProject_constraint {
  CourseProject_pkey = "CourseProject_pkey",
}

/**
 * update columns of table "CourseProject"
 */
export enum CourseProject_update_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseStatus"
 */
export enum CourseStatus_constraint {
  CourseStatus_pkey = "CourseStatus_pkey",
}

export enum CourseStatus_enum {
  APPLICANTS_INVITED = "APPLICANTS_INVITED",
  DRAFT = "DRAFT",
  PARTICIPANTS_RATED = "PARTICIPANTS_RATED",
  READY_FOR_APPLICATION = "READY_FOR_APPLICATION",
  READY_FOR_PUBLICATION = "READY_FOR_PUBLICATION",
}

/**
 * update columns of table "CourseStatus"
 */
export enum CourseStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Course"
 */
export enum Course_constraint {
  Course_pkey = "Course_pkey",
}

/**
 * update columns of table "Course"
 */
export enum Course_update_column {
  achievementCertificatePossible = "achievementCertificatePossible",
  applicationEnd = "applicationEnd",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  chatLink = "chatLink",
  contentDescriptionField1 = "contentDescriptionField1",
  contentDescriptionField2 = "contentDescriptionField2",
  cost = "cost",
  coverImage = "coverImage",
  created_at = "created_at",
  ects = "ects",
  endTime = "endTime",
  headingDescriptionField1 = "headingDescriptionField1",
  headingDescriptionField2 = "headingDescriptionField2",
  id = "id",
  language = "language",
  learningGoals = "learningGoals",
  maxMissedSessions = "maxMissedSessions",
  maxParticipants = "maxParticipants",
  programId = "programId",
  startTime = "startTime",
  status = "status",
  tagline = "tagline",
  title = "title",
  updated_at = "updated_at",
  visibility = "visibility",
  weekDay = "weekDay",
}

/**
 * unique or primary key constraints on table "Employment"
 */
export enum Employment_constraint {
  Employment_pkey = "Employment_pkey",
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

/**
 * update columns of table "Employment"
 */
export enum Employment_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Expert"
 */
export enum Expert_constraint {
  Instructor_pkey = "Instructor_pkey",
}

/**
 * update columns of table "Expert"
 */
export enum Expert_update_column {
  created_at = "created_at",
  description = "description",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "LocationOption"
 */
export enum LocationOption_constraint {
  LocationOptions_pkey = "LocationOptions_pkey",
}

/**
 * update columns of table "LocationOption"
 */
export enum LocationOption_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "MotivationRating"
 */
export enum MotivationRating_constraint {
  MotivationGrade_pkey = "MotivationGrade_pkey",
}

export enum MotivationRating_enum {
  DECLINE = "DECLINE",
  INVITE = "INVITE",
  REVIEW = "REVIEW",
  UNRATED = "UNRATED",
}

/**
 * update columns of table "MotivationRating"
 */
export enum MotivationRating_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Program"
 */
export enum Program_constraint {
  Semester_pkey = "Semester_pkey",
}

/**
 * update columns of table "Program"
 */
export enum Program_update_column {
  applicationStart = "applicationStart",
  attendanceCertificateTemplateURL = "attendanceCertificateTemplateURL",
  closingQuestionnaire = "closingQuestionnaire",
  defaultApplicationEnd = "defaultApplicationEnd",
  defaultMaxMissedSessions = "defaultMaxMissedSessions",
  id = "id",
  lectureEnd = "lectureEnd",
  lectureStart = "lectureStart",
  participationCertificateTemplateURL = "participationCertificateTemplateURL",
  projectRecordUploadDeadline = "projectRecordUploadDeadline",
  shortTitle = "shortTitle",
  speakerQuestionnaire = "speakerQuestionnaire",
  startQuestionnaire = "startQuestionnaire",
  title = "title",
  visibility = "visibility",
  visibilityAchievementCertificate = "visibilityAchievementCertificate",
  visibilityParticipationCertificate = "visibilityParticipationCertificate",
}

/**
 * unique or primary key constraints on table "ProjectEnrollment"
 */
export enum ProjectEnrollment_constraint {
  ProjectEnrollment_pkey = "ProjectEnrollment_pkey",
}

/**
 * update columns of table "ProjectEnrollment"
 */
export enum ProjectEnrollment_update_column {
  created_at = "created_at",
  enrollmentId = "enrollmentId",
  id = "id",
  projectId = "projectId",
  rating = "rating",
  recordURL = "recordURL",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectRating"
 */
export enum ProjectRating_constraint {
  PerformanceRating_pkey = "PerformanceRating_pkey",
}

/**
 * update columns of table "ProjectRating"
 */
export enum ProjectRating_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "ProjectType"
 */
export enum ProjectType_constraint {
  ProjectType_pkey = "ProjectType_pkey",
}

/**
 * update columns of table "ProjectType"
 */
export enum ProjectType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Project"
 */
export enum Project_constraint {
  Project_pkey = "Project_pkey",
}

/**
 * update columns of table "Project"
 */
export enum Project_update_column {
  created_at = "created_at",
  description = "description",
  id = "id",
  title = "title",
  type = "type",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "RentAScientistConfig"
 */
export enum RentAScientistConfig_constraint {
  RentAScientistConfig_pkey = "RentAScientistConfig_pkey",
}

/**
 * update columns of table "RentAScientistConfig"
 */
export enum RentAScientistConfig_update_column {
  id = "id",
  program_id = "program_id",
}

/**
 * unique or primary key constraints on table "SchoolClassRequest"
 */
export enum SchoolClassRequest_constraint {
  SchoolClassRequest_pkey = "SchoolClassRequest_pkey",
}

/**
 * update columns of table "SchoolClassRequest"
 */
export enum SchoolClassRequest_update_column {
  assigned_day = "assigned_day",
  classId = "classId",
  id = "id",
  offerId = "offerId",
  possibleDays = "possibleDays",
}

/**
 * unique or primary key constraints on table "SchoolClass"
 */
export enum SchoolClass_constraint {
  SchoolClass_pkey = "SchoolClass_pkey",
}

/**
 * update columns of table "SchoolClass"
 */
export enum SchoolClass_update_column {
  grade = "grade",
  id = "id",
  name = "name",
  schoolId = "schoolId",
  studensCount = "studensCount",
  teacherId = "teacherId",
}

/**
 * unique or primary key constraints on table "School"
 */
export enum School_constraint {
  School_pkey = "School_pkey",
}

/**
 * update columns of table "School"
 */
export enum School_update_column {
  city = "city",
  district = "district",
  dstnr = "dstnr",
  name = "name",
  postalCode = "postalCode",
  schoolType = "schoolType",
  street = "street",
}

/**
 * unique or primary key constraints on table "ScientistOfferRelation"
 */
export enum ScientistOfferRelation_constraint {
  ScientistOfferRelation_pkey = "ScientistOfferRelation_pkey",
}

/**
 * update columns of table "ScientistOfferRelation"
 */
export enum ScientistOfferRelation_update_column {
  offerId = "offerId",
  scientistId = "scientistId",
}

/**
 * unique or primary key constraints on table "ScientistOffer"
 */
export enum ScientistOffer_constraint {
  ScientistOffer_pkey = "ScientistOffer_pkey",
}

/**
 * update columns of table "ScientistOffer"
 */
export enum ScientistOffer_update_column {
  categories = "categories",
  classPreparation = "classPreparation",
  contactEmail = "contactEmail",
  contactName = "contactName",
  contactPhone = "contactPhone",
  description = "description",
  duration = "duration",
  equipmentRequired = "equipmentRequired",
  extraComment = "extraComment",
  format = "format",
  id = "id",
  institutionLogo = "institutionLogo",
  institutionName = "institutionName",
  maxDeployments = "maxDeployments",
  maximumGrade = "maximumGrade",
  minimumGrade = "minimumGrade",
  possibleDays = "possibleDays",
  possibleLocations = "possibleLocations",
  programId = "programId",
  researchSubject = "researchSubject",
  roomRequirements = "roomRequirements",
  subjectComment = "subjectComment",
  timeWindow = "timeWindow",
  title = "title",
}

/**
 * unique or primary key constraints on table "Scientist"
 */
export enum Scientist_constraint {
  Scientist_pkey = "Scientist_pkey",
}

/**
 * update columns of table "Scientist"
 */
export enum Scientist_update_column {
  forename = "forename",
  id = "id",
  image = "image",
  surname = "surname",
  title = "title",
}

/**
 * unique or primary key constraints on table "SessionAddress"
 */
export enum SessionAddress_constraint {
  SessionAddress_pkey = "SessionAddress_pkey",
}

/**
 * update columns of table "SessionAddress"
 */
export enum SessionAddress_update_column {
  created_at = "created_at",
  id = "id",
  latitude = "latitude",
  link = "link",
  longitude = "longitude",
  sessionId = "sessionId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "SessionSpeaker"
 */
export enum SessionSpeaker_constraint {
  SessionSpeaker_pkey = "SessionSpeaker_pkey",
}

/**
 * update columns of table "SessionSpeaker"
 */
export enum SessionSpeaker_update_column {
  created_at = "created_at",
  expertId = "expertId",
  id = "id",
  sessionId = "sessionId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "Session"
 */
export enum Session_constraint {
  Date_pkey = "Date_pkey",
}

/**
 * update columns of table "Session"
 */
export enum Session_update_column {
  courseId = "courseId",
  created_at = "created_at",
  description = "description",
  endDateTime = "endDateTime",
  id = "id",
  startDateTime = "startDateTime",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "Teacher"
 */
export enum Teacher_constraint {
  Teacher_pkey = "Teacher_pkey",
}

/**
 * update columns of table "Teacher"
 */
export enum Teacher_update_column {
  email = "email",
  forename = "forename",
  id = "id",
  schoolId = "schoolId",
  surname = "surname",
}

/**
 * unique or primary key constraints on table "University"
 */
export enum University_constraint {
  University_pkey = "University_pkey",
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
 * update columns of table "University"
 */
export enum University_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "User"
 */
export enum User_constraint {
  Person_AnonymId_key = "Person_AnonymId_key",
  User_pkey = "User_pkey",
}

/**
 * update columns of table "User"
 */
export enum User_update_column {
  anonymousId = "anonymousId",
  created_at = "created_at",
  email = "email",
  employment = "employment",
  externalProfile = "externalProfile",
  firstName = "firstName",
  id = "id",
  lastName = "lastName",
  matriculationNumber = "matriculationNumber",
  newsletterRegistration = "newsletterRegistration",
  otherUniversity = "otherUniversity",
  picture = "picture",
  university = "university",
  updated_at = "updated_at",
}

/**
 * input type for inserting array relation for remote table "Admin"
 */
export interface Admin_arr_rel_insert_input {
  data: Admin_insert_input[];
  on_conflict?: Admin_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "Admin". All fields are combined with a logical 'AND'.
 */
export interface Admin_bool_exp {
  User?: User_bool_exp | null;
  _and?: Admin_bool_exp[] | null;
  _not?: Admin_bool_exp | null;
  _or?: Admin_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "Admin"
 */
export interface Admin_insert_input {
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * on_conflict condition type for table "Admin"
 */
export interface Admin_on_conflict {
  constraint: Admin_constraint;
  update_columns: Admin_update_column[];
  where?: Admin_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "AttendanceSourceData"
 */
export interface AttendanceSourceData_arr_rel_insert_input {
  data: AttendanceSourceData_insert_input[];
  on_conflict?: AttendanceSourceData_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  source?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AttendanceSourceData"
 */
export interface AttendanceSourceData_insert_input {
  Session?: Session_obj_rel_insert_input | null;
  URL?: string | null;
  created_at?: any | null;
  id?: number | null;
  sessionId?: number | null;
  source?: string | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "AttendanceSourceData"
 */
export interface AttendanceSourceData_on_conflict {
  constraint: AttendanceSourceData_constraint;
  update_columns: AttendanceSourceData_update_column[];
  where?: AttendanceSourceData_bool_exp | null;
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
 * input type for inserting data into table "AttendanceSource"
 */
export interface AttendanceSource_insert_input {
  Attendances?: Attendance_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "AttendanceSource"
 */
export interface AttendanceSource_obj_rel_insert_input {
  data: AttendanceSource_insert_input;
  on_conflict?: AttendanceSource_on_conflict | null;
}

/**
 * on_conflict condition type for table "AttendanceSource"
 */
export interface AttendanceSource_on_conflict {
  constraint: AttendanceSource_constraint;
  update_columns: AttendanceSource_update_column[];
  where?: AttendanceSource_bool_exp | null;
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
 * input type for inserting data into table "AttendanceStatus"
 */
export interface AttendanceStatus_insert_input {
  Attendances?: Attendance_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "AttendanceStatus"
 */
export interface AttendanceStatus_obj_rel_insert_input {
  data: AttendanceStatus_insert_input;
  on_conflict?: AttendanceStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "AttendanceStatus"
 */
export interface AttendanceStatus_on_conflict {
  constraint: AttendanceStatus_constraint;
  update_columns: AttendanceStatus_update_column[];
  where?: AttendanceStatus_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "Attendance"
 */
export interface Attendance_arr_rel_insert_input {
  data: Attendance_insert_input[];
  on_conflict?: Attendance_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  endDateTime?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  interruptionCount?: Int_comparison_exp | null;
  recordedName?: String_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  source?: String_comparison_exp | null;
  startDateTime?: timestamptz_comparison_exp | null;
  status?: AttendanceStatus_enum_comparison_exp | null;
  totalAttendanceTime?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "Attendance"
 */
export interface Attendance_insert_input {
  AttendanceSource?: AttendanceSource_obj_rel_insert_input | null;
  AttendanceStatus?: AttendanceStatus_obj_rel_insert_input | null;
  Session?: Session_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  endDateTime?: any | null;
  id?: number | null;
  interruptionCount?: number | null;
  recordedName?: string | null;
  sessionId?: number | null;
  source?: string | null;
  startDateTime?: any | null;
  status?: AttendanceStatus_enum | null;
  totalAttendanceTime?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * on_conflict condition type for table "Attendance"
 */
export interface Attendance_on_conflict {
  constraint: Attendance_constraint;
  update_columns: Attendance_update_column[];
  where?: Attendance_bool_exp | null;
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
 * input type for inserting data into table "CourseEnrollmentStatus"
 */
export interface CourseEnrollmentStatus_insert_input {
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "CourseEnrollmentStatus"
 */
export interface CourseEnrollmentStatus_obj_rel_insert_input {
  data: CourseEnrollmentStatus_insert_input;
  on_conflict?: CourseEnrollmentStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseEnrollmentStatus"
 */
export interface CourseEnrollmentStatus_on_conflict {
  constraint: CourseEnrollmentStatus_constraint;
  update_columns: CourseEnrollmentStatus_update_column[];
  where?: CourseEnrollmentStatus_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "CourseEnrollment"
 */
export interface CourseEnrollment_arr_rel_insert_input {
  data: CourseEnrollment_insert_input[];
  on_conflict?: CourseEnrollment_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  invitationExpirationDate?: date_comparison_exp | null;
  motivationLetter?: String_comparison_exp | null;
  motivationRating?: MotivationRating_enum_comparison_exp | null;
  status?: CourseEnrollmentStatus_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseEnrollment"
 */
export interface CourseEnrollment_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_obj_rel_insert_input | null;
  MotivationRating?: MotivationRating_obj_rel_insert_input | null;
  ProjectEnrollments?: ProjectEnrollment_arr_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  achievementCertificateURL?: string | null;
  attendanceCertificateURL?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  invitationExpirationDate?: any | null;
  motivationLetter?: string | null;
  motivationRating?: MotivationRating_enum | null;
  status?: CourseEnrollmentStatus_enum | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * input type for inserting object relation for remote table "CourseEnrollment"
 */
export interface CourseEnrollment_obj_rel_insert_input {
  data: CourseEnrollment_insert_input;
  on_conflict?: CourseEnrollment_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseEnrollment"
 */
export interface CourseEnrollment_on_conflict {
  constraint: CourseEnrollment_constraint;
  update_columns: CourseEnrollment_update_column[];
  where?: CourseEnrollment_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "CourseInstructor"
 */
export interface CourseInstructor_arr_rel_insert_input {
  data: CourseInstructor_insert_input[];
  on_conflict?: CourseInstructor_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  expertId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseInstructor"
 */
export interface CourseInstructor_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  Expert?: Expert_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  expertId?: number | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "CourseInstructor"
 */
export interface CourseInstructor_on_conflict {
  constraint: CourseInstructor_constraint;
  update_columns: CourseInstructor_update_column[];
  where?: CourseInstructor_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "CourseLocation"
 */
export interface CourseLocation_arr_rel_insert_input {
  data: CourseLocation_insert_input[];
  on_conflict?: CourseLocation_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  latitude?: String_comparison_exp | null;
  link?: String_comparison_exp | null;
  locationOption?: String_comparison_exp | null;
  longitude?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseLocation"
 */
export interface CourseLocation_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  LocationOption?: LocationOption_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  latitude?: string | null;
  link?: string | null;
  locationOption?: string | null;
  longitude?: string | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "CourseLocation"
 */
export interface CourseLocation_on_conflict {
  constraint: CourseLocation_constraint;
  update_columns: CourseLocation_update_column[];
  where?: CourseLocation_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "CourseProject"
 */
export interface CourseProject_arr_rel_insert_input {
  data: CourseProject_insert_input[];
  on_conflict?: CourseProject_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseProject"
 */
export interface CourseProject_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  Project?: Project_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  projectId?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "CourseProject"
 */
export interface CourseProject_on_conflict {
  constraint: CourseProject_constraint;
  update_columns: CourseProject_update_column[];
  where?: CourseProject_bool_exp | null;
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
 * input type for inserting data into table "CourseStatus"
 */
export interface CourseStatus_insert_input {
  Courses?: Course_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "CourseStatus"
 */
export interface CourseStatus_obj_rel_insert_input {
  data: CourseStatus_insert_input;
  on_conflict?: CourseStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseStatus"
 */
export interface CourseStatus_on_conflict {
  constraint: CourseStatus_constraint;
  update_columns: CourseStatus_update_column[];
  where?: CourseStatus_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "Course"
 */
export interface Course_arr_rel_insert_input {
  data: Course_insert_input[];
  on_conflict?: Course_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  ects?: String_comparison_exp | null;
  endTime?: timestamptz_comparison_exp | null;
  headingDescriptionField1?: String_comparison_exp | null;
  headingDescriptionField2?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  language?: String_comparison_exp | null;
  learningGoals?: String_comparison_exp | null;
  maxMissedSessions?: Int_comparison_exp | null;
  maxParticipants?: Int_comparison_exp | null;
  programId?: Int_comparison_exp | null;
  startTime?: timestamptz_comparison_exp | null;
  status?: CourseStatus_enum_comparison_exp | null;
  tagline?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  visibility?: Boolean_comparison_exp | null;
  weekDay?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Course"
 */
export interface Course_insert_input {
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  CourseLocations?: CourseLocation_arr_rel_insert_input | null;
  CourseProjects?: CourseProject_arr_rel_insert_input | null;
  CourseStatus?: CourseStatus_obj_rel_insert_input | null;
  Program?: Program_obj_rel_insert_input | null;
  Sessions?: Session_arr_rel_insert_input | null;
  achievementCertificatePossible?: boolean | null;
  applicationEnd?: any | null;
  attendanceCertificatePossible?: boolean | null;
  chatLink?: string | null;
  contentDescriptionField1?: string | null;
  contentDescriptionField2?: string | null;
  cost?: string | null;
  coverImage?: string | null;
  created_at?: any | null;
  ects?: string | null;
  endTime?: any | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  maxMissedSessions?: number | null;
  maxParticipants?: number | null;
  programId?: number | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  tagline?: string | null;
  title?: string | null;
  updated_at?: any | null;
  visibility?: boolean | null;
  weekDay?: string | null;
}

/**
 * input type for inserting object relation for remote table "Course"
 */
export interface Course_obj_rel_insert_input {
  data: Course_insert_input;
  on_conflict?: Course_on_conflict | null;
}

/**
 * on_conflict condition type for table "Course"
 */
export interface Course_on_conflict {
  constraint: Course_constraint;
  update_columns: Course_update_column[];
  where?: Course_bool_exp | null;
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
 * input type for inserting data into table "Employment"
 */
export interface Employment_insert_input {
  Users?: User_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "Employment"
 */
export interface Employment_obj_rel_insert_input {
  data: Employment_insert_input;
  on_conflict?: Employment_on_conflict | null;
}

/**
 * on_conflict condition type for table "Employment"
 */
export interface Employment_on_conflict {
  constraint: Employment_constraint;
  update_columns: Employment_update_column[];
  where?: Employment_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "Expert"
 */
export interface Expert_arr_rel_insert_input {
  data: Expert_insert_input[];
  on_conflict?: Expert_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "Expert"
 */
export interface Expert_insert_input {
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  SessionSpeakers?: SessionSpeaker_arr_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  description?: string | null;
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * input type for inserting object relation for remote table "Expert"
 */
export interface Expert_obj_rel_insert_input {
  data: Expert_insert_input;
  on_conflict?: Expert_on_conflict | null;
}

/**
 * on_conflict condition type for table "Expert"
 */
export interface Expert_on_conflict {
  constraint: Expert_constraint;
  update_columns: Expert_update_column[];
  where?: Expert_bool_exp | null;
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
 * input type for inserting data into table "LocationOption"
 */
export interface LocationOption_insert_input {
  Locations?: CourseLocation_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "LocationOption"
 */
export interface LocationOption_obj_rel_insert_input {
  data: LocationOption_insert_input;
  on_conflict?: LocationOption_on_conflict | null;
}

/**
 * on_conflict condition type for table "LocationOption"
 */
export interface LocationOption_on_conflict {
  constraint: LocationOption_constraint;
  update_columns: LocationOption_update_column[];
  where?: LocationOption_bool_exp | null;
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
 * input type for inserting data into table "MotivationRating"
 */
export interface MotivationRating_insert_input {
  Enrollments?: CourseEnrollment_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "MotivationRating"
 */
export interface MotivationRating_obj_rel_insert_input {
  data: MotivationRating_insert_input;
  on_conflict?: MotivationRating_on_conflict | null;
}

/**
 * on_conflict condition type for table "MotivationRating"
 */
export interface MotivationRating_on_conflict {
  constraint: MotivationRating_constraint;
  update_columns: MotivationRating_update_column[];
  where?: MotivationRating_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "Program". All fields are combined with a logical 'AND'.
 */
export interface Program_bool_exp {
  Courses?: Course_bool_exp | null;
  RentAScientistConfigs?: RentAScientistConfig_bool_exp | null;
  ScientistOffers?: ScientistOffer_bool_exp | null;
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
 * input type for inserting data into table "Program"
 */
export interface Program_insert_input {
  Courses?: Course_arr_rel_insert_input | null;
  RentAScientistConfigs?: RentAScientistConfig_arr_rel_insert_input | null;
  ScientistOffers?: ScientistOffer_arr_rel_insert_input | null;
  applicationStart?: any | null;
  attendanceCertificateTemplateURL?: string | null;
  closingQuestionnaire?: string | null;
  defaultApplicationEnd?: any | null;
  defaultMaxMissedSessions?: number | null;
  id?: number | null;
  lectureEnd?: any | null;
  lectureStart?: any | null;
  participationCertificateTemplateURL?: string | null;
  projectRecordUploadDeadline?: any | null;
  shortTitle?: string | null;
  speakerQuestionnaire?: string | null;
  startQuestionnaire?: string | null;
  title?: string | null;
  visibility?: boolean | null;
  visibilityAchievementCertificate?: boolean | null;
  visibilityParticipationCertificate?: boolean | null;
}

/**
 * input type for inserting object relation for remote table "Program"
 */
export interface Program_obj_rel_insert_input {
  data: Program_insert_input;
  on_conflict?: Program_on_conflict | null;
}

/**
 * on_conflict condition type for table "Program"
 */
export interface Program_on_conflict {
  constraint: Program_constraint;
  update_columns: Program_update_column[];
  where?: Program_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "ProjectEnrollment"
 */
export interface ProjectEnrollment_arr_rel_insert_input {
  data: ProjectEnrollment_insert_input[];
  on_conflict?: ProjectEnrollment_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  enrollmentId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  rating?: String_comparison_exp | null;
  recordURL?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectEnrollment"
 */
export interface ProjectEnrollment_insert_input {
  Enrollment?: CourseEnrollment_obj_rel_insert_input | null;
  Project?: Project_obj_rel_insert_input | null;
  Rating?: ProjectRating_obj_rel_insert_input | null;
  created_at?: any | null;
  enrollmentId?: number | null;
  id?: number | null;
  projectId?: number | null;
  rating?: string | null;
  recordURL?: string | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "ProjectEnrollment"
 */
export interface ProjectEnrollment_on_conflict {
  constraint: ProjectEnrollment_constraint;
  update_columns: ProjectEnrollment_update_column[];
  where?: ProjectEnrollment_bool_exp | null;
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
 * input type for inserting data into table "ProjectRating"
 */
export interface ProjectRating_insert_input {
  ProjectEnrollments?: ProjectEnrollment_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "ProjectRating"
 */
export interface ProjectRating_obj_rel_insert_input {
  data: ProjectRating_insert_input;
  on_conflict?: ProjectRating_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectRating"
 */
export interface ProjectRating_on_conflict {
  constraint: ProjectRating_constraint;
  update_columns: ProjectRating_update_column[];
  where?: ProjectRating_bool_exp | null;
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
 * input type for inserting data into table "ProjectType"
 */
export interface ProjectType_insert_input {
  Projects?: Project_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "ProjectType"
 */
export interface ProjectType_obj_rel_insert_input {
  data: ProjectType_insert_input;
  on_conflict?: ProjectType_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectType"
 */
export interface ProjectType_on_conflict {
  constraint: ProjectType_constraint;
  update_columns: ProjectType_update_column[];
  where?: ProjectType_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "Project"
 */
export interface Project_arr_rel_insert_input {
  data: Project_insert_input[];
  on_conflict?: Project_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Project"
 */
export interface Project_insert_input {
  CourseProjects?: CourseProject_arr_rel_insert_input | null;
  ProjectEnrollments?: ProjectEnrollment_arr_rel_insert_input | null;
  ProjectType?: ProjectType_obj_rel_insert_input | null;
  created_at?: any | null;
  description?: string | null;
  id?: number | null;
  title?: string | null;
  type?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "Project"
 */
export interface Project_obj_rel_insert_input {
  data: Project_insert_input;
  on_conflict?: Project_on_conflict | null;
}

/**
 * on_conflict condition type for table "Project"
 */
export interface Project_on_conflict {
  constraint: Project_constraint;
  update_columns: Project_update_column[];
  where?: Project_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "RentAScientistConfig"
 */
export interface RentAScientistConfig_arr_rel_insert_input {
  data: RentAScientistConfig_insert_input[];
  on_conflict?: RentAScientistConfig_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "RentAScientistConfig". All fields are combined with a logical 'AND'.
 */
export interface RentAScientistConfig_bool_exp {
  Program?: Program_bool_exp | null;
  _and?: RentAScientistConfig_bool_exp[] | null;
  _not?: RentAScientistConfig_bool_exp | null;
  _or?: RentAScientistConfig_bool_exp[] | null;
  id?: Int_comparison_exp | null;
  program_id?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "RentAScientistConfig"
 */
export interface RentAScientistConfig_insert_input {
  Program?: Program_obj_rel_insert_input | null;
  id?: number | null;
  program_id?: number | null;
}

/**
 * on_conflict condition type for table "RentAScientistConfig"
 */
export interface RentAScientistConfig_on_conflict {
  constraint: RentAScientistConfig_constraint;
  update_columns: RentAScientistConfig_update_column[];
  where?: RentAScientistConfig_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "SchoolClassRequest"
 */
export interface SchoolClassRequest_arr_rel_insert_input {
  data: SchoolClassRequest_insert_input[];
  on_conflict?: SchoolClassRequest_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "SchoolClassRequest". All fields are combined with a logical 'AND'.
 */
export interface SchoolClassRequest_bool_exp {
  SchoolClass?: SchoolClass_bool_exp | null;
  ScientistOffer?: ScientistOffer_bool_exp | null;
  _and?: SchoolClassRequest_bool_exp[] | null;
  _not?: SchoolClassRequest_bool_exp | null;
  _or?: SchoolClassRequest_bool_exp[] | null;
  assigned_day?: Int_comparison_exp | null;
  classId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  offerId?: Int_comparison_exp | null;
  possibleDays?: _int4_comparison_exp | null;
}

/**
 * input type for inserting data into table "SchoolClassRequest"
 */
export interface SchoolClassRequest_insert_input {
  SchoolClass?: SchoolClass_obj_rel_insert_input | null;
  ScientistOffer?: ScientistOffer_obj_rel_insert_input | null;
  assigned_day?: number | null;
  classId?: number | null;
  id?: number | null;
  offerId?: number | null;
  possibleDays?: any | null;
}

/**
 * on_conflict condition type for table "SchoolClassRequest"
 */
export interface SchoolClassRequest_on_conflict {
  constraint: SchoolClassRequest_constraint;
  update_columns: SchoolClassRequest_update_column[];
  where?: SchoolClassRequest_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "SchoolClass"
 */
export interface SchoolClass_arr_rel_insert_input {
  data: SchoolClass_insert_input[];
  on_conflict?: SchoolClass_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "SchoolClass". All fields are combined with a logical 'AND'.
 */
export interface SchoolClass_bool_exp {
  School?: School_bool_exp | null;
  SchoolClassRequests?: SchoolClassRequest_bool_exp | null;
  Teacher?: Teacher_bool_exp | null;
  _and?: SchoolClass_bool_exp[] | null;
  _not?: SchoolClass_bool_exp | null;
  _or?: SchoolClass_bool_exp[] | null;
  grade?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  name?: String_comparison_exp | null;
  schoolId?: String_comparison_exp | null;
  studensCount?: Int_comparison_exp | null;
  teacherId?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "SchoolClass"
 */
export interface SchoolClass_insert_input {
  School?: School_obj_rel_insert_input | null;
  SchoolClassRequests?: SchoolClassRequest_arr_rel_insert_input | null;
  Teacher?: Teacher_obj_rel_insert_input | null;
  grade?: number | null;
  id?: number | null;
  name?: string | null;
  schoolId?: string | null;
  studensCount?: number | null;
  teacherId?: number | null;
}

/**
 * input type for inserting object relation for remote table "SchoolClass"
 */
export interface SchoolClass_obj_rel_insert_input {
  data: SchoolClass_insert_input;
  on_conflict?: SchoolClass_on_conflict | null;
}

/**
 * on_conflict condition type for table "SchoolClass"
 */
export interface SchoolClass_on_conflict {
  constraint: SchoolClass_constraint;
  update_columns: SchoolClass_update_column[];
  where?: SchoolClass_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "School". All fields are combined with a logical 'AND'.
 */
export interface School_bool_exp {
  SchoolClasses?: SchoolClass_bool_exp | null;
  Teachers?: Teacher_bool_exp | null;
  _and?: School_bool_exp[] | null;
  _not?: School_bool_exp | null;
  _or?: School_bool_exp[] | null;
  city?: String_comparison_exp | null;
  district?: String_comparison_exp | null;
  dstnr?: String_comparison_exp | null;
  name?: String_comparison_exp | null;
  postalCode?: String_comparison_exp | null;
  schoolType?: String_comparison_exp | null;
  street?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "School"
 */
export interface School_insert_input {
  SchoolClasses?: SchoolClass_arr_rel_insert_input | null;
  Teachers?: Teacher_arr_rel_insert_input | null;
  city?: string | null;
  district?: string | null;
  dstnr?: string | null;
  name?: string | null;
  postalCode?: string | null;
  schoolType?: string | null;
  street?: string | null;
}

/**
 * input type for inserting object relation for remote table "School"
 */
export interface School_obj_rel_insert_input {
  data: School_insert_input;
  on_conflict?: School_on_conflict | null;
}

/**
 * on_conflict condition type for table "School"
 */
export interface School_on_conflict {
  constraint: School_constraint;
  update_columns: School_update_column[];
  where?: School_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "ScientistOfferRelation"
 */
export interface ScientistOfferRelation_arr_rel_insert_input {
  data: ScientistOfferRelation_insert_input[];
  on_conflict?: ScientistOfferRelation_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "ScientistOfferRelation". All fields are combined with a logical 'AND'.
 */
export interface ScientistOfferRelation_bool_exp {
  Scientist?: Scientist_bool_exp | null;
  ScientistOffer?: ScientistOffer_bool_exp | null;
  _and?: ScientistOfferRelation_bool_exp[] | null;
  _not?: ScientistOfferRelation_bool_exp | null;
  _or?: ScientistOfferRelation_bool_exp[] | null;
  offerId?: Int_comparison_exp | null;
  scientistId?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "ScientistOfferRelation"
 */
export interface ScientistOfferRelation_insert_input {
  Scientist?: Scientist_obj_rel_insert_input | null;
  ScientistOffer?: ScientistOffer_obj_rel_insert_input | null;
  offerId?: number | null;
  scientistId?: number | null;
}

/**
 * on_conflict condition type for table "ScientistOfferRelation"
 */
export interface ScientistOfferRelation_on_conflict {
  constraint: ScientistOfferRelation_constraint;
  update_columns: ScientistOfferRelation_update_column[];
  where?: ScientistOfferRelation_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "ScientistOffer"
 */
export interface ScientistOffer_arr_rel_insert_input {
  data: ScientistOffer_insert_input[];
  on_conflict?: ScientistOffer_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "ScientistOffer". All fields are combined with a logical 'AND'.
 */
export interface ScientistOffer_bool_exp {
  Program?: Program_bool_exp | null;
  SchoolClassRequests?: SchoolClassRequest_bool_exp | null;
  ScientistOfferRelations?: ScientistOfferRelation_bool_exp | null;
  _and?: ScientistOffer_bool_exp[] | null;
  _not?: ScientistOffer_bool_exp | null;
  _or?: ScientistOffer_bool_exp[] | null;
  categories?: _text_comparison_exp | null;
  classPreparation?: String_comparison_exp | null;
  contactEmail?: String_comparison_exp | null;
  contactName?: String_comparison_exp | null;
  contactPhone?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  duration?: String_comparison_exp | null;
  equipmentRequired?: String_comparison_exp | null;
  extraComment?: String_comparison_exp | null;
  format?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  institutionLogo?: String_comparison_exp | null;
  institutionName?: String_comparison_exp | null;
  maxDeployments?: Int_comparison_exp | null;
  maximumGrade?: Int_comparison_exp | null;
  minimumGrade?: Int_comparison_exp | null;
  possibleDays?: _int4_comparison_exp | null;
  possibleLocations?: _text_comparison_exp | null;
  programId?: Int_comparison_exp | null;
  researchSubject?: String_comparison_exp | null;
  roomRequirements?: String_comparison_exp | null;
  subjectComment?: String_comparison_exp | null;
  timeWindow?: _text_comparison_exp | null;
  title?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "ScientistOffer"
 */
export interface ScientistOffer_insert_input {
  Program?: Program_obj_rel_insert_input | null;
  SchoolClassRequests?: SchoolClassRequest_arr_rel_insert_input | null;
  ScientistOfferRelations?: ScientistOfferRelation_arr_rel_insert_input | null;
  categories?: any | null;
  classPreparation?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  duration?: string | null;
  equipmentRequired?: string | null;
  extraComment?: string | null;
  format?: string | null;
  id?: number | null;
  institutionLogo?: string | null;
  institutionName?: string | null;
  maxDeployments?: number | null;
  maximumGrade?: number | null;
  minimumGrade?: number | null;
  possibleDays?: any | null;
  possibleLocations?: any | null;
  programId?: number | null;
  researchSubject?: string | null;
  roomRequirements?: string | null;
  subjectComment?: string | null;
  timeWindow?: any | null;
  title?: string | null;
}

/**
 * input type for inserting object relation for remote table "ScientistOffer"
 */
export interface ScientistOffer_obj_rel_insert_input {
  data: ScientistOffer_insert_input;
  on_conflict?: ScientistOffer_on_conflict | null;
}

/**
 * on_conflict condition type for table "ScientistOffer"
 */
export interface ScientistOffer_on_conflict {
  constraint: ScientistOffer_constraint;
  update_columns: ScientistOffer_update_column[];
  where?: ScientistOffer_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "Scientist". All fields are combined with a logical 'AND'.
 */
export interface Scientist_bool_exp {
  ScientistOfferRelations?: ScientistOfferRelation_bool_exp | null;
  _and?: Scientist_bool_exp[] | null;
  _not?: Scientist_bool_exp | null;
  _or?: Scientist_bool_exp[] | null;
  forename?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  image?: String_comparison_exp | null;
  surname?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Scientist"
 */
export interface Scientist_insert_input {
  ScientistOfferRelations?: ScientistOfferRelation_arr_rel_insert_input | null;
  forename?: string | null;
  id?: number | null;
  image?: string | null;
  surname?: string | null;
  title?: string | null;
}

/**
 * input type for inserting object relation for remote table "Scientist"
 */
export interface Scientist_obj_rel_insert_input {
  data: Scientist_insert_input;
  on_conflict?: Scientist_on_conflict | null;
}

/**
 * on_conflict condition type for table "Scientist"
 */
export interface Scientist_on_conflict {
  constraint: Scientist_constraint;
  update_columns: Scientist_update_column[];
  where?: Scientist_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "SessionAddress"
 */
export interface SessionAddress_arr_rel_insert_input {
  data: SessionAddress_insert_input[];
  on_conflict?: SessionAddress_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "SessionAddress". All fields are combined with a logical 'AND'.
 */
export interface SessionAddress_bool_exp {
  Session?: Session_bool_exp | null;
  _and?: SessionAddress_bool_exp[] | null;
  _not?: SessionAddress_bool_exp | null;
  _or?: SessionAddress_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  latitude?: String_comparison_exp | null;
  link?: String_comparison_exp | null;
  longitude?: String_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "SessionAddress"
 */
export interface SessionAddress_insert_input {
  Session?: Session_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  latitude?: string | null;
  link?: string | null;
  longitude?: string | null;
  sessionId?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "SessionAddress"
 */
export interface SessionAddress_on_conflict {
  constraint: SessionAddress_constraint;
  update_columns: SessionAddress_update_column[];
  where?: SessionAddress_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "SessionSpeaker"
 */
export interface SessionSpeaker_arr_rel_insert_input {
  data: SessionSpeaker_insert_input[];
  on_conflict?: SessionSpeaker_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  expertId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "SessionSpeaker"
 */
export interface SessionSpeaker_insert_input {
  Expert?: Expert_obj_rel_insert_input | null;
  Session?: Session_obj_rel_insert_input | null;
  created_at?: any | null;
  expertId?: number | null;
  id?: number | null;
  sessionId?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "SessionSpeaker"
 */
export interface SessionSpeaker_on_conflict {
  constraint: SessionSpeaker_constraint;
  update_columns: SessionSpeaker_update_column[];
  where?: SessionSpeaker_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "Session"
 */
export interface Session_arr_rel_insert_input {
  data: Session_insert_input[];
  on_conflict?: Session_on_conflict | null;
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
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  endDateTime?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  startDateTime?: timestamptz_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Session"
 */
export interface Session_insert_input {
  AttendanceDocuments?: AttendanceSourceData_arr_rel_insert_input | null;
  Attendances?: Attendance_arr_rel_insert_input | null;
  Course?: Course_obj_rel_insert_input | null;
  SessionAddresses?: SessionAddress_arr_rel_insert_input | null;
  SessionSpeakers?: SessionSpeaker_arr_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  description?: string | null;
  endDateTime?: any | null;
  id?: number | null;
  startDateTime?: any | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "Session"
 */
export interface Session_obj_rel_insert_input {
  data: Session_insert_input;
  on_conflict?: Session_on_conflict | null;
}

/**
 * on_conflict condition type for table "Session"
 */
export interface Session_on_conflict {
  constraint: Session_constraint;
  update_columns: Session_update_column[];
  where?: Session_bool_exp | null;
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
 * input type for inserting array relation for remote table "Teacher"
 */
export interface Teacher_arr_rel_insert_input {
  data: Teacher_insert_input[];
  on_conflict?: Teacher_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "Teacher". All fields are combined with a logical 'AND'.
 */
export interface Teacher_bool_exp {
  School?: School_bool_exp | null;
  SchoolClasses?: SchoolClass_bool_exp | null;
  _and?: Teacher_bool_exp[] | null;
  _not?: Teacher_bool_exp | null;
  _or?: Teacher_bool_exp[] | null;
  email?: String_comparison_exp | null;
  forename?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  schoolId?: String_comparison_exp | null;
  surname?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Teacher"
 */
export interface Teacher_insert_input {
  School?: School_obj_rel_insert_input | null;
  SchoolClasses?: SchoolClass_arr_rel_insert_input | null;
  email?: string | null;
  forename?: string | null;
  id?: number | null;
  schoolId?: string | null;
  surname?: string | null;
}

/**
 * input type for inserting object relation for remote table "Teacher"
 */
export interface Teacher_obj_rel_insert_input {
  data: Teacher_insert_input;
  on_conflict?: Teacher_on_conflict | null;
}

/**
 * on_conflict condition type for table "Teacher"
 */
export interface Teacher_on_conflict {
  constraint: Teacher_constraint;
  update_columns: Teacher_update_column[];
  where?: Teacher_bool_exp | null;
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
 * input type for inserting data into table "University"
 */
export interface University_insert_input {
  Users?: User_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "University"
 */
export interface University_obj_rel_insert_input {
  data: University_insert_input;
  on_conflict?: University_on_conflict | null;
}

/**
 * on_conflict condition type for table "University"
 */
export interface University_on_conflict {
  constraint: University_constraint;
  update_columns: University_update_column[];
  where?: University_bool_exp | null;
}

/**
 * input type for inserting array relation for remote table "User"
 */
export interface User_arr_rel_insert_input {
  data: User_insert_input[];
  on_conflict?: User_on_conflict | null;
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
 * input type for inserting data into table "User"
 */
export interface User_insert_input {
  Admins?: Admin_arr_rel_insert_input | null;
  Attendances?: Attendance_arr_rel_insert_input | null;
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  Experts?: Expert_arr_rel_insert_input | null;
  anonymousId?: string | null;
  created_at?: any | null;
  email?: string | null;
  employment?: Employment_enum | null;
  employmentByEmployment?: Employment_obj_rel_insert_input | null;
  externalProfile?: string | null;
  firstName?: string | null;
  id?: any | null;
  lastName?: string | null;
  matriculationNumber?: string | null;
  newsletterRegistration?: boolean | null;
  otherUniversity?: string | null;
  picture?: string | null;
  university?: University_enum | null;
  universityByUniversity?: University_obj_rel_insert_input | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "User"
 */
export interface User_obj_rel_insert_input {
  data: User_insert_input;
  on_conflict?: User_on_conflict | null;
}

/**
 * on_conflict condition type for table "User"
 */
export interface User_on_conflict {
  constraint: User_constraint;
  update_columns: User_update_column[];
  where?: User_bool_exp | null;
}

/**
 * Boolean expression to compare columns of type "_int4". All fields are combined with logical 'AND'.
 */
export interface _int4_comparison_exp {
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
 * Boolean expression to compare columns of type "_text". All fields are combined with logical 'AND'.
 */
export interface _text_comparison_exp {
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
