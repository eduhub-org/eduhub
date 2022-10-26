/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * unique or primary key constraints on table "AchievementOptionCourse"
 */
export enum AchievementOptionCourse_constraint {
  AchievementOptionCourse_pkey = "AchievementOptionCourse_pkey",
}

/**
 * update columns of table "AchievementOptionCourse"
 */
export enum AchievementOptionCourse_update_column {
  achievementOptionId = "achievementOptionId",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "AchievementOptionMentor"
 */
export enum AchievementOptionMentor_constraint {
  AchievementOptionMentor_pkey = "AchievementOptionMentor_pkey",
}

/**
 * update columns of table "AchievementOptionMentor"
 */
export enum AchievementOptionMentor_update_column {
  achievementOptionId = "achievementOptionId",
  created_at = "created_at",
  expertId = "expertId",
  id = "id",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "AchievementOption"
 */
export enum AchievementOption_constraint {
  AchievementOption_pkey = "AchievementOption_pkey",
}

/**
 * update columns of table "AchievementOption"
 */
export enum AchievementOption_update_column {
  created_at = "created_at",
  description = "description",
  documentationTemplateUrl = "documentationTemplateUrl",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  recordType = "recordType",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "AchievementRecordAuthor"
 */
export enum AchievementRecordAuthor_constraint {
  AchievementRecordAuthor_pkey = "AchievementRecordAuthor_pkey",
}

/**
 * update columns of table "AchievementRecordAuthor"
 */
export enum AchievementRecordAuthor_update_column {
  achievementRecordId = "achievementRecordId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "AchievementRecordRating"
 */
export enum AchievementRecordRating_constraint {
  PerformanceRating_pkey = "PerformanceRating_pkey",
}

export enum AchievementRecordRating_enum {
  FAILED = "FAILED",
  PASSED = "PASSED",
  UNRATED = "UNRATED",
}

/**
 * update columns of table "AchievementRecordRating"
 */
export enum AchievementRecordRating_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "AchievementRecordType"
 */
export enum AchievementRecordType_constraint {
  AchievementRecordType_pkey = "AchievementRecordType_pkey",
}

export enum AchievementRecordType_enum {
  DOCUMENTATION = "DOCUMENTATION",
  DOCUMENTATION_AND_CSV = "DOCUMENTATION_AND_CSV",
  ONLINE = "ONLINE",
}

/**
 * update columns of table "AchievementRecordType"
 */
export enum AchievementRecordType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "AchievementRecord"
 */
export enum AchievementRecord_constraint {
  AchievementRecord_pkey = "AchievementRecord_pkey",
}

/**
 * update columns of table "AchievementRecord"
 */
export enum AchievementRecord_update_column {
  AchievementOptionId = "AchievementOptionId",
  coverImageUrl = "coverImageUrl",
  description = "description",
  id = "id",
  rating = "rating",
  score = "score",
  uploadUserId = "uploadUserId",
}

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
  mailFrom = "mailFrom",
  program_id = "program_id",
  test_operation = "test_operation",
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
  commentGeneral = "commentGeneral",
  commentTime = "commentTime",
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
  contact = "contact",
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
  Teacher_userId_key = "Teacher_userId_key",
}

/**
 * update columns of table "Teacher"
 */
export enum Teacher_update_column {
  id = "id",
  userId = "userId",
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
 * column ordering options
 */
export enum order_by {
  asc = "asc",
  asc_nulls_first = "asc_nulls_first",
  asc_nulls_last = "asc_nulls_last",
  desc = "desc",
  desc_nulls_first = "desc_nulls_first",
  desc_nulls_last = "desc_nulls_last",
}

/**
 * order by aggregate values of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_aggregate_order_by {
  avg?: AchievementOptionCourse_avg_order_by | null;
  count?: order_by | null;
  max?: AchievementOptionCourse_max_order_by | null;
  min?: AchievementOptionCourse_min_order_by | null;
  stddev?: AchievementOptionCourse_stddev_order_by | null;
  stddev_pop?: AchievementOptionCourse_stddev_pop_order_by | null;
  stddev_samp?: AchievementOptionCourse_stddev_samp_order_by | null;
  sum?: AchievementOptionCourse_sum_order_by | null;
  var_pop?: AchievementOptionCourse_var_pop_order_by | null;
  var_samp?: AchievementOptionCourse_var_samp_order_by | null;
  variance?: AchievementOptionCourse_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_arr_rel_insert_input {
  data: AchievementOptionCourse_insert_input[];
  on_conflict?: AchievementOptionCourse_on_conflict | null;
}

/**
 * order by avg() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_avg_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementOptionCourse". All fields are combined with a logical 'AND'.
 */
export interface AchievementOptionCourse_bool_exp {
  AchievementOption?: AchievementOption_bool_exp | null;
  Course?: Course_bool_exp | null;
  _and?: AchievementOptionCourse_bool_exp[] | null;
  _not?: AchievementOptionCourse_bool_exp | null;
  _or?: AchievementOptionCourse_bool_exp[] | null;
  achievementOptionId?: Int_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_insert_input {
  AchievementOption?: AchievementOption_obj_rel_insert_input | null;
  Course?: Course_obj_rel_insert_input | null;
  achievementOptionId?: number | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_max_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_min_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_on_conflict {
  constraint: AchievementOptionCourse_constraint;
  update_columns: AchievementOptionCourse_update_column[];
  where?: AchievementOptionCourse_bool_exp | null;
}

/**
 * Ordering options when selecting data from "AchievementOptionCourse".
 */
export interface AchievementOptionCourse_order_by {
  AchievementOption?: AchievementOption_order_by | null;
  Course?: Course_order_by | null;
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for updating data in table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_set_input {
  achievementOptionId?: number | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_stddev_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_stddev_pop_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_stddev_samp_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_sum_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_var_pop_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_var_samp_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementOptionCourse"
 */
export interface AchievementOptionCourse_variance_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by aggregate values of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_aggregate_order_by {
  avg?: AchievementOptionMentor_avg_order_by | null;
  count?: order_by | null;
  max?: AchievementOptionMentor_max_order_by | null;
  min?: AchievementOptionMentor_min_order_by | null;
  stddev?: AchievementOptionMentor_stddev_order_by | null;
  stddev_pop?: AchievementOptionMentor_stddev_pop_order_by | null;
  stddev_samp?: AchievementOptionMentor_stddev_samp_order_by | null;
  sum?: AchievementOptionMentor_sum_order_by | null;
  var_pop?: AchievementOptionMentor_var_pop_order_by | null;
  var_samp?: AchievementOptionMentor_var_samp_order_by | null;
  variance?: AchievementOptionMentor_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_arr_rel_insert_input {
  data: AchievementOptionMentor_insert_input[];
  on_conflict?: AchievementOptionMentor_on_conflict | null;
}

/**
 * order by avg() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_avg_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementOptionMentor". All fields are combined with a logical 'AND'.
 */
export interface AchievementOptionMentor_bool_exp {
  AchievementOption?: AchievementOption_bool_exp | null;
  Expert?: Expert_bool_exp | null;
  _and?: AchievementOptionMentor_bool_exp[] | null;
  _not?: AchievementOptionMentor_bool_exp | null;
  _or?: AchievementOptionMentor_bool_exp[] | null;
  achievementOptionId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  expertId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_insert_input {
  AchievementOption?: AchievementOption_obj_rel_insert_input | null;
  Expert?: Expert_obj_rel_insert_input | null;
  achievementOptionId?: number | null;
  created_at?: any | null;
  expertId?: number | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_max_order_by {
  achievementOptionId?: order_by | null;
  created_at?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_min_order_by {
  achievementOptionId?: order_by | null;
  created_at?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_on_conflict {
  constraint: AchievementOptionMentor_constraint;
  update_columns: AchievementOptionMentor_update_column[];
  where?: AchievementOptionMentor_bool_exp | null;
}

/**
 * input type for updating data in table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_set_input {
  achievementOptionId?: number | null;
  created_at?: any | null;
  expertId?: number | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_pop_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_samp_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_sum_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_var_pop_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_var_samp_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_variance_order_by {
  achievementOptionId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by aggregate values of table "AchievementOption"
 */
export interface AchievementOption_aggregate_order_by {
  avg?: AchievementOption_avg_order_by | null;
  count?: order_by | null;
  max?: AchievementOption_max_order_by | null;
  min?: AchievementOption_min_order_by | null;
  stddev?: AchievementOption_stddev_order_by | null;
  stddev_pop?: AchievementOption_stddev_pop_order_by | null;
  stddev_samp?: AchievementOption_stddev_samp_order_by | null;
  sum?: AchievementOption_sum_order_by | null;
  var_pop?: AchievementOption_var_pop_order_by | null;
  var_samp?: AchievementOption_var_samp_order_by | null;
  variance?: AchievementOption_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "AchievementOption"
 */
export interface AchievementOption_arr_rel_insert_input {
  data: AchievementOption_insert_input[];
  on_conflict?: AchievementOption_on_conflict | null;
}

/**
 * order by avg() on columns of table "AchievementOption"
 */
export interface AchievementOption_avg_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementOption". All fields are combined with a logical 'AND'.
 */
export interface AchievementOption_bool_exp {
  AchievementOptionCourses?: AchievementOptionCourse_bool_exp | null;
  AchievementOptionMentors?: AchievementOptionMentor_bool_exp | null;
  AchievementRecordType?: AchievementRecordType_bool_exp | null;
  AchievementRecords?: AchievementRecord_bool_exp | null;
  _and?: AchievementOption_bool_exp[] | null;
  _not?: AchievementOption_bool_exp | null;
  _or?: AchievementOption_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  documentationTemplateUrl?: String_comparison_exp | null;
  evaluationScriptUrl?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  recordType?: AchievementRecordType_enum_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementOption"
 */
export interface AchievementOption_insert_input {
  AchievementOptionCourses?: AchievementOptionCourse_arr_rel_insert_input | null;
  AchievementOptionMentors?: AchievementOptionMentor_arr_rel_insert_input | null;
  AchievementRecordType?: AchievementRecordType_obj_rel_insert_input | null;
  AchievementRecords?: AchievementRecord_arr_rel_insert_input | null;
  created_at?: any | null;
  description?: string | null;
  documentationTemplateUrl?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  recordType?: AchievementRecordType_enum | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "AchievementOption"
 */
export interface AchievementOption_max_order_by {
  created_at?: order_by | null;
  description?: order_by | null;
  documentationTemplateUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementOption"
 */
export interface AchievementOption_min_order_by {
  created_at?: order_by | null;
  description?: order_by | null;
  documentationTemplateUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "AchievementOption"
 */
export interface AchievementOption_obj_rel_insert_input {
  data: AchievementOption_insert_input;
  on_conflict?: AchievementOption_on_conflict | null;
}

/**
 * on_conflict condition type for table "AchievementOption"
 */
export interface AchievementOption_on_conflict {
  constraint: AchievementOption_constraint;
  update_columns: AchievementOption_update_column[];
  where?: AchievementOption_bool_exp | null;
}

/**
 * Ordering options when selecting data from "AchievementOption".
 */
export interface AchievementOption_order_by {
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_order_by | null;
  AchievementOptionMentors_aggregate?: AchievementOptionMentor_aggregate_order_by | null;
  AchievementRecordType?: AchievementRecordType_order_by | null;
  AchievementRecords_aggregate?: AchievementRecord_aggregate_order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  documentationTemplateUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  recordType?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for updating data in table "AchievementOption"
 */
export interface AchievementOption_set_input {
  created_at?: any | null;
  description?: string | null;
  documentationTemplateUrl?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  recordType?: AchievementRecordType_enum | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_pop_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_samp_order_by {
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementOption"
 */
export interface AchievementOption_sum_order_by {
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementOption"
 */
export interface AchievementOption_var_pop_order_by {
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementOption"
 */
export interface AchievementOption_var_samp_order_by {
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementOption"
 */
export interface AchievementOption_variance_order_by {
  id?: order_by | null;
}

/**
 * order by aggregate values of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_aggregate_order_by {
  avg?: AchievementRecordAuthor_avg_order_by | null;
  count?: order_by | null;
  max?: AchievementRecordAuthor_max_order_by | null;
  min?: AchievementRecordAuthor_min_order_by | null;
  stddev?: AchievementRecordAuthor_stddev_order_by | null;
  stddev_pop?: AchievementRecordAuthor_stddev_pop_order_by | null;
  stddev_samp?: AchievementRecordAuthor_stddev_samp_order_by | null;
  sum?: AchievementRecordAuthor_sum_order_by | null;
  var_pop?: AchievementRecordAuthor_var_pop_order_by | null;
  var_samp?: AchievementRecordAuthor_var_samp_order_by | null;
  variance?: AchievementRecordAuthor_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_arr_rel_insert_input {
  data: AchievementRecordAuthor_insert_input[];
  on_conflict?: AchievementRecordAuthor_on_conflict | null;
}

/**
 * order by avg() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_avg_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecordAuthor". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecordAuthor_bool_exp {
  AchievementRecord?: AchievementRecord_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: AchievementRecordAuthor_bool_exp[] | null;
  _not?: AchievementRecordAuthor_bool_exp | null;
  _or?: AchievementRecordAuthor_bool_exp[] | null;
  achievementRecordId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_insert_input {
  AchievementRecord?: AchievementRecord_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  achievementRecordId?: number | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_max_order_by {
  achievementRecordId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_min_order_by {
  achievementRecordId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * on_conflict condition type for table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_on_conflict {
  constraint: AchievementRecordAuthor_constraint;
  update_columns: AchievementRecordAuthor_update_column[];
  where?: AchievementRecordAuthor_bool_exp | null;
}

/**
 * order by stddev() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_stddev_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_stddev_pop_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_stddev_samp_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_sum_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_var_pop_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_var_samp_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementRecordAuthor"
 */
export interface AchievementRecordAuthor_variance_order_by {
  achievementRecordId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecordRating". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecordRating_bool_exp {
  AchievementRecords?: AchievementRecord_bool_exp | null;
  _and?: AchievementRecordRating_bool_exp[] | null;
  _not?: AchievementRecordRating_bool_exp | null;
  _or?: AchievementRecordRating_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "AchievementRecordRating_enum". All fields are combined with logical 'AND'.
 */
export interface AchievementRecordRating_enum_comparison_exp {
  _eq?: AchievementRecordRating_enum | null;
  _in?: AchievementRecordRating_enum[] | null;
  _is_null?: boolean | null;
  _neq?: AchievementRecordRating_enum | null;
  _nin?: AchievementRecordRating_enum[] | null;
}

/**
 * input type for inserting data into table "AchievementRecordRating"
 */
export interface AchievementRecordRating_insert_input {
  AchievementRecords?: AchievementRecord_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "AchievementRecordRating"
 */
export interface AchievementRecordRating_obj_rel_insert_input {
  data: AchievementRecordRating_insert_input;
  on_conflict?: AchievementRecordRating_on_conflict | null;
}

/**
 * on_conflict condition type for table "AchievementRecordRating"
 */
export interface AchievementRecordRating_on_conflict {
  constraint: AchievementRecordRating_constraint;
  update_columns: AchievementRecordRating_update_column[];
  where?: AchievementRecordRating_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecordType". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecordType_bool_exp {
  AchievementOptions?: AchievementOption_bool_exp | null;
  _and?: AchievementRecordType_bool_exp[] | null;
  _not?: AchievementRecordType_bool_exp | null;
  _or?: AchievementRecordType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "AchievementRecordType_enum". All fields are combined with logical 'AND'.
 */
export interface AchievementRecordType_enum_comparison_exp {
  _eq?: AchievementRecordType_enum | null;
  _in?: AchievementRecordType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: AchievementRecordType_enum | null;
  _nin?: AchievementRecordType_enum[] | null;
}

/**
 * input type for inserting data into table "AchievementRecordType"
 */
export interface AchievementRecordType_insert_input {
  AchievementOptions?: AchievementOption_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "AchievementRecordType"
 */
export interface AchievementRecordType_obj_rel_insert_input {
  data: AchievementRecordType_insert_input;
  on_conflict?: AchievementRecordType_on_conflict | null;
}

/**
 * on_conflict condition type for table "AchievementRecordType"
 */
export interface AchievementRecordType_on_conflict {
  constraint: AchievementRecordType_constraint;
  update_columns: AchievementRecordType_update_column[];
  where?: AchievementRecordType_bool_exp | null;
}

/**
 * Ordering options when selecting data from "AchievementRecordType".
 */
export interface AchievementRecordType_order_by {
  AchievementOptions_aggregate?: AchievementOption_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * order by aggregate values of table "AchievementRecord"
 */
export interface AchievementRecord_aggregate_order_by {
  avg?: AchievementRecord_avg_order_by | null;
  count?: order_by | null;
  max?: AchievementRecord_max_order_by | null;
  min?: AchievementRecord_min_order_by | null;
  stddev?: AchievementRecord_stddev_order_by | null;
  stddev_pop?: AchievementRecord_stddev_pop_order_by | null;
  stddev_samp?: AchievementRecord_stddev_samp_order_by | null;
  sum?: AchievementRecord_sum_order_by | null;
  var_pop?: AchievementRecord_var_pop_order_by | null;
  var_samp?: AchievementRecord_var_samp_order_by | null;
  variance?: AchievementRecord_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "AchievementRecord"
 */
export interface AchievementRecord_arr_rel_insert_input {
  data: AchievementRecord_insert_input[];
  on_conflict?: AchievementRecord_on_conflict | null;
}

/**
 * order by avg() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_avg_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecord". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecord_bool_exp {
  AchievementOption?: AchievementOption_bool_exp | null;
  AchievementOptionId?: Int_comparison_exp | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_bool_exp | null;
  AchievementRecordRating?: AchievementRecordRating_bool_exp | null;
  _and?: AchievementRecord_bool_exp[] | null;
  _not?: AchievementRecord_bool_exp | null;
  _or?: AchievementRecord_bool_exp[] | null;
  coverImageUrl?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  rating?: AchievementRecordRating_enum_comparison_exp | null;
  score?: numeric_comparison_exp | null;
  uploadUserId?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementRecord"
 */
export interface AchievementRecord_insert_input {
  AchievementOption?: AchievementOption_obj_rel_insert_input | null;
  AchievementOptionId?: number | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_arr_rel_insert_input | null;
  AchievementRecordRating?: AchievementRecordRating_obj_rel_insert_input | null;
  coverImageUrl?: string | null;
  description?: string | null;
  id?: number | null;
  rating?: AchievementRecordRating_enum | null;
  score?: any | null;
  uploadUserId?: number | null;
}

/**
 * order by max() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_max_order_by {
  AchievementOptionId?: order_by | null;
  coverImageUrl?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_min_order_by {
  AchievementOptionId?: order_by | null;
  coverImageUrl?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "AchievementRecord"
 */
export interface AchievementRecord_obj_rel_insert_input {
  data: AchievementRecord_insert_input;
  on_conflict?: AchievementRecord_on_conflict | null;
}

/**
 * on_conflict condition type for table "AchievementRecord"
 */
export interface AchievementRecord_on_conflict {
  constraint: AchievementRecord_constraint;
  update_columns: AchievementRecord_update_column[];
  where?: AchievementRecord_bool_exp | null;
}

/**
 * order by stddev() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_pop_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_samp_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_sum_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_var_pop_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_var_samp_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_variance_order_by {
  AchievementOptionId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by aggregate values of table "Admin"
 */
export interface Admin_aggregate_order_by {
  avg?: Admin_avg_order_by | null;
  count?: order_by | null;
  max?: Admin_max_order_by | null;
  min?: Admin_min_order_by | null;
  stddev?: Admin_stddev_order_by | null;
  stddev_pop?: Admin_stddev_pop_order_by | null;
  stddev_samp?: Admin_stddev_samp_order_by | null;
  sum?: Admin_sum_order_by | null;
  var_pop?: Admin_var_pop_order_by | null;
  var_samp?: Admin_var_samp_order_by | null;
  variance?: Admin_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Admin"
 */
export interface Admin_arr_rel_insert_input {
  data: Admin_insert_input[];
  on_conflict?: Admin_on_conflict | null;
}

/**
 * order by avg() on columns of table "Admin"
 */
export interface Admin_avg_order_by {
  id?: order_by | null;
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
 * order by max() on columns of table "Admin"
 */
export interface Admin_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "Admin"
 */
export interface Admin_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * order by stddev() on columns of table "Admin"
 */
export interface Admin_stddev_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Admin"
 */
export interface Admin_stddev_pop_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Admin"
 */
export interface Admin_stddev_samp_order_by {
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Admin"
 */
export interface Admin_sum_order_by {
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Admin"
 */
export interface Admin_var_pop_order_by {
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Admin"
 */
export interface Admin_var_samp_order_by {
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Admin"
 */
export interface Admin_variance_order_by {
  id?: order_by | null;
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
 * order by aggregate values of table "Attendance"
 */
export interface Attendance_aggregate_order_by {
  avg?: Attendance_avg_order_by | null;
  count?: order_by | null;
  max?: Attendance_max_order_by | null;
  min?: Attendance_min_order_by | null;
  stddev?: Attendance_stddev_order_by | null;
  stddev_pop?: Attendance_stddev_pop_order_by | null;
  stddev_samp?: Attendance_stddev_samp_order_by | null;
  sum?: Attendance_sum_order_by | null;
  var_pop?: Attendance_var_pop_order_by | null;
  var_samp?: Attendance_var_samp_order_by | null;
  variance?: Attendance_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Attendance"
 */
export interface Attendance_arr_rel_insert_input {
  data: Attendance_insert_input[];
  on_conflict?: Attendance_on_conflict | null;
}

/**
 * order by avg() on columns of table "Attendance"
 */
export interface Attendance_avg_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
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
 * order by max() on columns of table "Attendance"
 */
export interface Attendance_max_order_by {
  created_at?: order_by | null;
  endDateTime?: order_by | null;
  id?: order_by | null;
  interruptionCount?: order_by | null;
  recordedName?: order_by | null;
  sessionId?: order_by | null;
  source?: order_by | null;
  startDateTime?: order_by | null;
  totalAttendanceTime?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "Attendance"
 */
export interface Attendance_min_order_by {
  created_at?: order_by | null;
  endDateTime?: order_by | null;
  id?: order_by | null;
  interruptionCount?: order_by | null;
  recordedName?: order_by | null;
  sessionId?: order_by | null;
  source?: order_by | null;
  startDateTime?: order_by | null;
  totalAttendanceTime?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * input type for updating data in table "Attendance"
 */
export interface Attendance_set_input {
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
 * order by stddev() on columns of table "Attendance"
 */
export interface Attendance_stddev_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Attendance"
 */
export interface Attendance_stddev_pop_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Attendance"
 */
export interface Attendance_stddev_samp_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by sum() on columns of table "Attendance"
 */
export interface Attendance_sum_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Attendance"
 */
export interface Attendance_var_pop_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Attendance"
 */
export interface Attendance_var_samp_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
}

/**
 * order by variance() on columns of table "Attendance"
 */
export interface Attendance_variance_order_by {
  id?: order_by | null;
  interruptionCount?: order_by | null;
  sessionId?: order_by | null;
  totalAttendanceTime?: order_by | null;
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
 * order by aggregate values of table "CourseEnrollment"
 */
export interface CourseEnrollment_aggregate_order_by {
  avg?: CourseEnrollment_avg_order_by | null;
  count?: order_by | null;
  max?: CourseEnrollment_max_order_by | null;
  min?: CourseEnrollment_min_order_by | null;
  stddev?: CourseEnrollment_stddev_order_by | null;
  stddev_pop?: CourseEnrollment_stddev_pop_order_by | null;
  stddev_samp?: CourseEnrollment_stddev_samp_order_by | null;
  sum?: CourseEnrollment_sum_order_by | null;
  var_pop?: CourseEnrollment_var_pop_order_by | null;
  var_samp?: CourseEnrollment_var_samp_order_by | null;
  variance?: CourseEnrollment_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseEnrollment"
 */
export interface CourseEnrollment_arr_rel_insert_input {
  data: CourseEnrollment_insert_input[];
  on_conflict?: CourseEnrollment_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollment". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollment_bool_exp {
  Course?: Course_bool_exp | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_bool_exp | null;
  MotivationRating?: MotivationRating_bool_exp | null;
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
 * order by max() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_max_order_by {
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  motivationLetter?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_min_order_by {
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  motivationLetter?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * order by stddev() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by aggregate values of table "CourseInstructor"
 */
export interface CourseInstructor_aggregate_order_by {
  avg?: CourseInstructor_avg_order_by | null;
  count?: order_by | null;
  max?: CourseInstructor_max_order_by | null;
  min?: CourseInstructor_min_order_by | null;
  stddev?: CourseInstructor_stddev_order_by | null;
  stddev_pop?: CourseInstructor_stddev_pop_order_by | null;
  stddev_samp?: CourseInstructor_stddev_samp_order_by | null;
  sum?: CourseInstructor_sum_order_by | null;
  var_pop?: CourseInstructor_var_pop_order_by | null;
  var_samp?: CourseInstructor_var_samp_order_by | null;
  variance?: CourseInstructor_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseInstructor"
 */
export interface CourseInstructor_arr_rel_insert_input {
  data: CourseInstructor_insert_input[];
  on_conflict?: CourseInstructor_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_avg_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
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
 * order by max() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
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
 * order by stddev() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_stddev_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_stddev_pop_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_stddev_samp_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_sum_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_var_pop_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_var_samp_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_variance_order_by {
  courseId?: order_by | null;
  expertId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by aggregate values of table "CourseLocation"
 */
export interface CourseLocation_aggregate_order_by {
  avg?: CourseLocation_avg_order_by | null;
  count?: order_by | null;
  max?: CourseLocation_max_order_by | null;
  min?: CourseLocation_min_order_by | null;
  stddev?: CourseLocation_stddev_order_by | null;
  stddev_pop?: CourseLocation_stddev_pop_order_by | null;
  stddev_samp?: CourseLocation_stddev_samp_order_by | null;
  sum?: CourseLocation_sum_order_by | null;
  var_pop?: CourseLocation_var_pop_order_by | null;
  var_samp?: CourseLocation_var_samp_order_by | null;
  variance?: CourseLocation_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseLocation"
 */
export interface CourseLocation_arr_rel_insert_input {
  data: CourseLocation_insert_input[];
  on_conflict?: CourseLocation_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseLocation"
 */
export interface CourseLocation_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
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
 * order by max() on columns of table "CourseLocation"
 */
export interface CourseLocation_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  latitude?: order_by | null;
  link?: order_by | null;
  locationOption?: order_by | null;
  longitude?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseLocation"
 */
export interface CourseLocation_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  latitude?: order_by | null;
  link?: order_by | null;
  locationOption?: order_by | null;
  longitude?: order_by | null;
  updated_at?: order_by | null;
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
 * order by stddev() on columns of table "CourseLocation"
 */
export interface CourseLocation_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseLocation"
 */
export interface CourseLocation_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseLocation"
 */
export interface CourseLocation_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseLocation"
 */
export interface CourseLocation_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseLocation"
 */
export interface CourseLocation_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseLocation"
 */
export interface CourseLocation_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseLocation"
 */
export interface CourseLocation_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
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
 * Ordering options when selecting data from "CourseStatus".
 */
export interface CourseStatus_order_by {
  Courses_aggregate?: Course_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * order by aggregate values of table "Course"
 */
export interface Course_aggregate_order_by {
  avg?: Course_avg_order_by | null;
  count?: order_by | null;
  max?: Course_max_order_by | null;
  min?: Course_min_order_by | null;
  stddev?: Course_stddev_order_by | null;
  stddev_pop?: Course_stddev_pop_order_by | null;
  stddev_samp?: Course_stddev_samp_order_by | null;
  sum?: Course_sum_order_by | null;
  var_pop?: Course_var_pop_order_by | null;
  var_samp?: Course_var_samp_order_by | null;
  variance?: Course_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Course"
 */
export interface Course_arr_rel_insert_input {
  data: Course_insert_input[];
  on_conflict?: Course_on_conflict | null;
}

/**
 * order by avg() on columns of table "Course"
 */
export interface Course_avg_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Course". All fields are combined with a logical 'AND'.
 */
export interface Course_bool_exp {
  AchievementOptionCourses?: AchievementOptionCourse_bool_exp | null;
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  CourseInstructors?: CourseInstructor_bool_exp | null;
  CourseLocations?: CourseLocation_bool_exp | null;
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
  AchievementOptionCourses?: AchievementOptionCourse_arr_rel_insert_input | null;
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  CourseLocations?: CourseLocation_arr_rel_insert_input | null;
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
 * order by max() on columns of table "Course"
 */
export interface Course_max_order_by {
  applicationEnd?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  ects?: order_by | null;
  endTime?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  startTime?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  weekDay?: order_by | null;
}

/**
 * order by min() on columns of table "Course"
 */
export interface Course_min_order_by {
  applicationEnd?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  ects?: order_by | null;
  endTime?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  startTime?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  weekDay?: order_by | null;
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
 * Ordering options when selecting data from "Course".
 */
export interface Course_order_by {
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_order_by | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_order_by | null;
  CourseLocations_aggregate?: CourseLocation_aggregate_order_by | null;
  CourseStatus?: CourseStatus_order_by | null;
  Program?: Program_order_by | null;
  Sessions_aggregate?: Session_aggregate_order_by | null;
  achievementCertificatePossible?: order_by | null;
  applicationEnd?: order_by | null;
  attendanceCertificatePossible?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  ects?: order_by | null;
  endTime?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  startTime?: order_by | null;
  status?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  visibility?: order_by | null;
  weekDay?: order_by | null;
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
 * order by stddev() on columns of table "Course"
 */
export interface Course_stddev_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Course"
 */
export interface Course_stddev_pop_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Course"
 */
export interface Course_stddev_samp_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by sum() on columns of table "Course"
 */
export interface Course_sum_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Course"
 */
export interface Course_var_pop_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Course"
 */
export interface Course_var_samp_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by variance() on columns of table "Course"
 */
export interface Course_variance_order_by {
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
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
 * Ordering options when selecting data from "Employment".
 */
export interface Employment_order_by {
  Users_aggregate?: User_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * order by aggregate values of table "Expert"
 */
export interface Expert_aggregate_order_by {
  avg?: Expert_avg_order_by | null;
  count?: order_by | null;
  max?: Expert_max_order_by | null;
  min?: Expert_min_order_by | null;
  stddev?: Expert_stddev_order_by | null;
  stddev_pop?: Expert_stddev_pop_order_by | null;
  stddev_samp?: Expert_stddev_samp_order_by | null;
  sum?: Expert_sum_order_by | null;
  var_pop?: Expert_var_pop_order_by | null;
  var_samp?: Expert_var_samp_order_by | null;
  variance?: Expert_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Expert"
 */
export interface Expert_arr_rel_insert_input {
  data: Expert_insert_input[];
  on_conflict?: Expert_on_conflict | null;
}

/**
 * order by avg() on columns of table "Expert"
 */
export interface Expert_avg_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Expert". All fields are combined with a logical 'AND'.
 */
export interface Expert_bool_exp {
  AchievementOptionMentors?: AchievementOptionMentor_bool_exp | null;
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
  AchievementOptionMentors?: AchievementOptionMentor_arr_rel_insert_input | null;
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
 * order by max() on columns of table "Expert"
 */
export interface Expert_max_order_by {
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "Expert"
 */
export interface Expert_min_order_by {
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * order by stddev() on columns of table "Expert"
 */
export interface Expert_stddev_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Expert"
 */
export interface Expert_stddev_pop_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Expert"
 */
export interface Expert_stddev_samp_order_by {
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Expert"
 */
export interface Expert_sum_order_by {
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Expert"
 */
export interface Expert_var_pop_order_by {
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Expert"
 */
export interface Expert_var_samp_order_by {
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Expert"
 */
export interface Expert_variance_order_by {
  id?: order_by | null;
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
 * Ordering options when selecting data from "Program".
 */
export interface Program_order_by {
  Courses_aggregate?: Course_aggregate_order_by | null;
  RentAScientistConfigs_aggregate?: RentAScientistConfig_aggregate_order_by | null;
  ScientistOffers_aggregate?: ScientistOffer_aggregate_order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  participationCertificateTemplateURL?: order_by | null;
  projectRecordUploadDeadline?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
  visibility?: order_by | null;
  visibilityAchievementCertificate?: order_by | null;
  visibilityParticipationCertificate?: order_by | null;
}

/**
 * order by aggregate values of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_aggregate_order_by {
  avg?: RentAScientistConfig_avg_order_by | null;
  count?: order_by | null;
  max?: RentAScientistConfig_max_order_by | null;
  min?: RentAScientistConfig_min_order_by | null;
  stddev?: RentAScientistConfig_stddev_order_by | null;
  stddev_pop?: RentAScientistConfig_stddev_pop_order_by | null;
  stddev_samp?: RentAScientistConfig_stddev_samp_order_by | null;
  sum?: RentAScientistConfig_sum_order_by | null;
  var_pop?: RentAScientistConfig_var_pop_order_by | null;
  var_samp?: RentAScientistConfig_var_samp_order_by | null;
  variance?: RentAScientistConfig_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "RentAScientistConfig"
 */
export interface RentAScientistConfig_arr_rel_insert_input {
  data: RentAScientistConfig_insert_input[];
  on_conflict?: RentAScientistConfig_on_conflict | null;
}

/**
 * order by avg() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_avg_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
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
  mailFrom?: String_comparison_exp | null;
  program_id?: Int_comparison_exp | null;
  test_operation?: Boolean_comparison_exp | null;
}

/**
 * input type for inserting data into table "RentAScientistConfig"
 */
export interface RentAScientistConfig_insert_input {
  Program?: Program_obj_rel_insert_input | null;
  id?: number | null;
  mailFrom?: string | null;
  program_id?: number | null;
  test_operation?: boolean | null;
}

/**
 * order by max() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_max_order_by {
  id?: order_by | null;
  mailFrom?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by min() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_min_order_by {
  id?: order_by | null;
  mailFrom?: order_by | null;
  program_id?: order_by | null;
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
 * order by stddev() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_pop_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_samp_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by sum() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_sum_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_var_pop_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_var_samp_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by variance() on columns of table "RentAScientistConfig"
 */
export interface RentAScientistConfig_variance_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
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
  commentGeneral?: String_comparison_exp | null;
  commentTime?: String_comparison_exp | null;
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
  commentGeneral?: string | null;
  commentTime?: string | null;
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
  contact?: String_comparison_exp | null;
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
  contact?: string | null;
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
 * order by aggregate values of table "ScientistOffer"
 */
export interface ScientistOffer_aggregate_order_by {
  avg?: ScientistOffer_avg_order_by | null;
  count?: order_by | null;
  max?: ScientistOffer_max_order_by | null;
  min?: ScientistOffer_min_order_by | null;
  stddev?: ScientistOffer_stddev_order_by | null;
  stddev_pop?: ScientistOffer_stddev_pop_order_by | null;
  stddev_samp?: ScientistOffer_stddev_samp_order_by | null;
  sum?: ScientistOffer_sum_order_by | null;
  var_pop?: ScientistOffer_var_pop_order_by | null;
  var_samp?: ScientistOffer_var_samp_order_by | null;
  variance?: ScientistOffer_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ScientistOffer"
 */
export interface ScientistOffer_arr_rel_insert_input {
  data: ScientistOffer_insert_input[];
  on_conflict?: ScientistOffer_on_conflict | null;
}

/**
 * order by avg() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_avg_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
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
 * order by max() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_max_order_by {
  classPreparation?: order_by | null;
  contactEmail?: order_by | null;
  contactName?: order_by | null;
  contactPhone?: order_by | null;
  description?: order_by | null;
  duration?: order_by | null;
  equipmentRequired?: order_by | null;
  extraComment?: order_by | null;
  format?: order_by | null;
  id?: order_by | null;
  institutionLogo?: order_by | null;
  institutionName?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
  researchSubject?: order_by | null;
  roomRequirements?: order_by | null;
  subjectComment?: order_by | null;
  title?: order_by | null;
}

/**
 * order by min() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_min_order_by {
  classPreparation?: order_by | null;
  contactEmail?: order_by | null;
  contactName?: order_by | null;
  contactPhone?: order_by | null;
  description?: order_by | null;
  duration?: order_by | null;
  equipmentRequired?: order_by | null;
  extraComment?: order_by | null;
  format?: order_by | null;
  id?: order_by | null;
  institutionLogo?: order_by | null;
  institutionName?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
  researchSubject?: order_by | null;
  roomRequirements?: order_by | null;
  subjectComment?: order_by | null;
  title?: order_by | null;
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
 * order by stddev() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_stddev_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_stddev_pop_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_stddev_samp_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by sum() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_sum_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_var_pop_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_var_samp_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by variance() on columns of table "ScientistOffer"
 */
export interface ScientistOffer_variance_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
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
 * order by aggregate values of table "Session"
 */
export interface Session_aggregate_order_by {
  avg?: Session_avg_order_by | null;
  count?: order_by | null;
  max?: Session_max_order_by | null;
  min?: Session_min_order_by | null;
  stddev?: Session_stddev_order_by | null;
  stddev_pop?: Session_stddev_pop_order_by | null;
  stddev_samp?: Session_stddev_samp_order_by | null;
  sum?: Session_sum_order_by | null;
  var_pop?: Session_var_pop_order_by | null;
  var_samp?: Session_var_samp_order_by | null;
  variance?: Session_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Session"
 */
export interface Session_arr_rel_insert_input {
  data: Session_insert_input[];
  on_conflict?: Session_on_conflict | null;
}

/**
 * order by avg() on columns of table "Session"
 */
export interface Session_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
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
 * order by max() on columns of table "Session"
 */
export interface Session_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  endDateTime?: order_by | null;
  id?: order_by | null;
  startDateTime?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "Session"
 */
export interface Session_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  endDateTime?: order_by | null;
  id?: order_by | null;
  startDateTime?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
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
 * order by stddev() on columns of table "Session"
 */
export interface Session_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Session"
 */
export interface Session_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Session"
 */
export interface Session_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Session"
 */
export interface Session_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Session"
 */
export interface Session_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Session"
 */
export interface Session_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Session"
 */
export interface Session_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
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
 * Boolean expression to filter rows from the table "Teacher". All fields are combined with a logical 'AND'.
 */
export interface Teacher_bool_exp {
  SchoolClasses?: SchoolClass_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: Teacher_bool_exp[] | null;
  _not?: Teacher_bool_exp | null;
  _or?: Teacher_bool_exp[] | null;
  id?: Int_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "Teacher"
 */
export interface Teacher_insert_input {
  SchoolClasses?: SchoolClass_arr_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  id?: number | null;
  userId?: any | null;
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
 * Ordering options when selecting data from "University".
 */
export interface University_order_by {
  Users_aggregate?: User_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * order by aggregate values of table "User"
 */
export interface User_aggregate_order_by {
  count?: order_by | null;
  max?: User_max_order_by | null;
  min?: User_min_order_by | null;
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
  AchievementRecordAuthors?: AchievementRecordAuthor_bool_exp | null;
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
  AchievementRecordAuthors?: AchievementRecordAuthor_arr_rel_insert_input | null;
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
 * order by max() on columns of table "User"
 */
export interface User_max_order_by {
  anonymousId?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  otherUniversity?: order_by | null;
  picture?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "User"
 */
export interface User_min_order_by {
  anonymousId?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  otherUniversity?: order_by | null;
  picture?: order_by | null;
  updated_at?: order_by | null;
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
 * Ordering options when selecting data from "User".
 */
export interface User_order_by {
  AchievementRecordAuthors_aggregate?: AchievementRecordAuthor_aggregate_order_by | null;
  Admins_aggregate?: Admin_aggregate_order_by | null;
  Attendances_aggregate?: Attendance_aggregate_order_by | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  Experts_aggregate?: Expert_aggregate_order_by | null;
  anonymousId?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  employment?: order_by | null;
  employmentByEmployment?: Employment_order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  newsletterRegistration?: order_by | null;
  otherUniversity?: order_by | null;
  picture?: order_by | null;
  university?: order_by | null;
  universityByUniversity?: University_order_by | null;
  updated_at?: order_by | null;
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
 * Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'.
 */
export interface numeric_comparison_exp {
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
