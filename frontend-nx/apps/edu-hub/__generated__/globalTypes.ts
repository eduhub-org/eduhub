/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * unique or primary key constraints on table "AchievementDocumentationTemplate"
 */
export enum AchievementDocumentationTemplate_constraint {
  AchievementDocumentationTemplate_pkey = "AchievementDocumentationTemplate_pkey",
  AchievementDocumentationTemplate_title_key = "AchievementDocumentationTemplate_title_key",
}

/**
 * update columns of table "AchievementDocumentationTemplate"
 */
export enum AchievementDocumentationTemplate_update_column {
  created_at = "created_at",
  id = "id",
  title = "title",
  updated_at = "updated_at",
  url = "url",
}

/**
 * unique or primary key constraints on table "AchievementOptionCourse"
 */
export enum AchievementOptionCourse_constraint {
  AchievementOptionCourse_pkey = "AchievementOptionCourse_pkey",
}

/**
 * select columns of table "AchievementOptionCourse"
 */
export enum AchievementOptionCourse_select_column {
  achievementOptionId = "achievementOptionId",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
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
 * select columns of table "AchievementOptionMentor"
 */
export enum AchievementOptionMentor_select_column {
  achievementOptionId = "achievementOptionId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "AchievementOptionMentor"
 */
export enum AchievementOptionMentor_update_column {
  achievementOptionId = "achievementOptionId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "AchievementOption"
 */
export enum AchievementOption_constraint {
  AchievementOption_pkey = "AchievementOption_pkey",
}

/**
 * select columns of table "AchievementOption"
 */
export enum AchievementOption_select_column {
  achievementDocumentationTemplateId = "achievementDocumentationTemplateId",
  created_at = "created_at",
  csvTemplateUrl = "csvTemplateUrl",
  description = "description",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  published = "published",
  recordType = "recordType",
  showScoreAuthors = "showScoreAuthors",
  title = "title",
  updated_at = "updated_at",
}

/**
 * select "AchievementOption_aggregate_bool_exp_bool_and_arguments_columns" columns of table "AchievementOption"
 */
export enum AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_and_arguments_columns {
  published = "published",
  showScoreAuthors = "showScoreAuthors",
}

/**
 * select "AchievementOption_aggregate_bool_exp_bool_or_arguments_columns" columns of table "AchievementOption"
 */
export enum AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_or_arguments_columns {
  published = "published",
  showScoreAuthors = "showScoreAuthors",
}

/**
 * update columns of table "AchievementOption"
 */
export enum AchievementOption_update_column {
  achievementDocumentationTemplateId = "achievementDocumentationTemplateId",
  created_at = "created_at",
  csvTemplateUrl = "csvTemplateUrl",
  description = "description",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  published = "published",
  recordType = "recordType",
  showScoreAuthors = "showScoreAuthors",
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
 * select columns of table "AchievementRecordAuthor"
 */
export enum AchievementRecordAuthor_select_column {
  achievementRecordId = "achievementRecordId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
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
  ONLINE_COURSE = "ONLINE_COURSE",
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
 * select columns of table "AchievementRecord"
 */
export enum AchievementRecord_select_column {
  achievementOptionId = "achievementOptionId",
  courseId = "courseId",
  coverImageUrl = "coverImageUrl",
  created_at = "created_at",
  csvResults = "csvResults",
  description = "description",
  documentationUrl = "documentationUrl",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  rating = "rating",
  score = "score",
  updated_at = "updated_at",
  uploadUserId = "uploadUserId",
}

/**
 * update columns of table "AchievementRecord"
 */
export enum AchievementRecord_update_column {
  achievementOptionId = "achievementOptionId",
  courseId = "courseId",
  coverImageUrl = "coverImageUrl",
  created_at = "created_at",
  csvResults = "csvResults",
  description = "description",
  documentationUrl = "documentationUrl",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  rating = "rating",
  score = "score",
  updated_at = "updated_at",
  uploadUserId = "uploadUserId",
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
 * select columns of table "Attendance"
 */
export enum Attendance_select_column {
  created_at = "created_at",
  endDateTime = "endDateTime",
  id = "id",
  interruptionCount = "interruptionCount",
  location = "location",
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
 * update columns of table "Attendance"
 */
export enum Attendance_update_column {
  created_at = "created_at",
  endDateTime = "endDateTime",
  id = "id",
  interruptionCount = "interruptionCount",
  location = "location",
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
 * unique or primary key constraints on table "CertificateTemplateProgram"
 */
export enum CertificateTemplateProgram_constraint {
  CertificateTemplateProgram_pkey = "CertificateTemplateProgram_pkey",
}

/**
 * select columns of table "CertificateTemplateProgram"
 */
export enum CertificateTemplateProgram_select_column {
  certificateTemplateText = "certificateTemplateText",
  id = "id",
  programId = "programId",
}

/**
 * update columns of table "CertificateTemplateProgram"
 */
export enum CertificateTemplateProgram_update_column {
  certificateTemplateText = "certificateTemplateText",
  id = "id",
  programId = "programId",
}

/**
 * unique or primary key constraints on table "CertificateTemplateText"
 */
export enum CertificateTemplateText_constraint {
  CertificateTemplateText_pkey = "CertificateTemplateText_pkey",
  CertificateTemplateText_title_key = "CertificateTemplateText_title_key",
}

/**
 * select columns of table "CertificateTemplateText"
 */
export enum CertificateTemplateText_select_column {
  certificateType = "certificateType",
  created_at = "created_at",
  html = "html",
  id = "id",
  recordType = "recordType",
  title = "title",
  updated_at = "updated_at",
}

/**
 * update columns of table "CertificateTemplateText"
 */
export enum CertificateTemplateText_update_column {
  certificateType = "certificateType",
  created_at = "created_at",
  html = "html",
  id = "id",
  recordType = "recordType",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CertificateType"
 */
export enum CertificateType_constraint {
  CertificateType_pkey = "CertificateType_pkey",
}

export enum CertificateType_enum {
  ACHIEVEMENT = "ACHIEVEMENT",
  ATTENDANCE = "ATTENDANCE",
}

/**
 * update columns of table "CertificateType"
 */
export enum CertificateType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Country"
 */
export enum Country_constraint {
  Country_pkey = "Country_pkey",
}

/**
 * update columns of table "Country"
 */
export enum Country_update_column {
  code = "code",
  name_de = "name_de",
  name_en = "name_en",
}

/**
 * unique or primary key constraints on table "CourseDegree"
 */
export enum CourseDegree_constraint {
  CourseDegree_pkey = "CourseDegree_pkey",
}

/**
 * select columns of table "CourseDegree"
 */
export enum CourseDegree_select_column {
  courseId = "courseId",
  created_at = "created_at",
  degreeCourseId = "degreeCourseId",
  id = "id",
  updated_at = "updated_at",
}

/**
 * update columns of table "CourseDegree"
 */
export enum CourseDegree_update_column {
  courseId = "courseId",
  created_at = "created_at",
  degreeCourseId = "degreeCourseId",
  id = "id",
  updated_at = "updated_at",
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
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  INVITED = "INVITED",
  REGISTERED = "REGISTERED",
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
  uniqueUserCourse = "uniqueUserCourse",
}

/**
 * select columns of table "CourseEnrollment"
 */
export enum CourseEnrollment_select_column {
  achievementCertificateURL = "achievementCertificateURL",
  attendanceCertificateURL = "attendanceCertificateURL",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  invitationExpirationDate = "invitationExpirationDate",
  location = "location",
  motivationLetter = "motivationLetter",
  motivationRating = "motivationRating",
  status = "status",
  updated_at = "updated_at",
  userId = "userId",
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
  location = "location",
  motivationLetter = "motivationLetter",
  motivationRating = "motivationRating",
  status = "status",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "CourseFundingOrganization"
 */
export enum CourseFundingOrganization_constraint {
  CourseFundingOrganization_courseId_organizationId_key = "CourseFundingOrganization_courseId_organizationId_key",
  CourseFundingOrganization_pkey = "CourseFundingOrganization_pkey",
}

/**
 * select columns of table "CourseFundingOrganization"
 */
export enum CourseFundingOrganization_select_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  updated_at = "updated_at",
}

/**
 * update columns of table "CourseFundingOrganization"
 */
export enum CourseFundingOrganization_update_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseGroupOption"
 */
export enum CourseGroupOption_constraint {
  CourseGroupOption_pkey = "CourseGroupOption_pkey",
  CourseGroupOption_title_key = "CourseGroupOption_title_key",
}

/**
 * update columns of table "CourseGroupOption"
 */
export enum CourseGroupOption_update_column {
  created_at = "created_at",
  id = "id",
  order = "order",
  sliderGroup = "sliderGroup",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseGroup"
 */
export enum CourseGroup_constraint {
  CourseGroup_pkey = "CourseGroup_pkey",
}

/**
 * select columns of table "CourseGroup"
 */
export enum CourseGroup_select_column {
  courseId = "courseId",
  created_at = "created_at",
  groupOptionId = "groupOptionId",
  id = "id",
  updated_at = "updated_at",
}

/**
 * update columns of table "CourseGroup"
 */
export enum CourseGroup_update_column {
  courseId = "courseId",
  created_at = "created_at",
  groupOptionId = "groupOptionId",
  id = "id",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseInstructor"
 */
export enum CourseInstructor_constraint {
  CourseInstructor_pkey = "CourseInstructor_pkey",
}

/**
 * select columns of table "CourseInstructor"
 */
export enum CourseInstructor_select_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "CourseInstructor"
 */
export enum CourseInstructor_update_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "CourseLocation"
 */
export enum CourseLocation_constraint {
  CourseLocation_pkey = "CourseLocation_pkey",
  unique_courseid_locationoption = "unique_courseid_locationoption",
}

/**
 * select columns of table "CourseLocation"
 */
export enum CourseLocation_select_column {
  courseId = "courseId",
  created_at = "created_at",
  defaultSessionAddress = "defaultSessionAddress",
  defaultSessionAddressId = "defaultSessionAddressId",
  id = "id",
  locationOption = "locationOption",
  updated_at = "updated_at",
}

/**
 * update columns of table "CourseLocation"
 */
export enum CourseLocation_update_column {
  courseId = "courseId",
  created_at = "created_at",
  defaultSessionAddress = "defaultSessionAddress",
  defaultSessionAddressId = "defaultSessionAddressId",
  id = "id",
  locationOption = "locationOption",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CourseRegistrationType"
 */
export enum CourseRegistrationType_constraint {
  CourseRegistrationType_pkey = "CourseRegistrationType_pkey",
}

export enum CourseRegistrationType_enum {
  APPROVAL_WITH_INPUT = "APPROVAL_WITH_INPUT",
  DIRECT_CONFIRMATION = "DIRECT_CONFIRMATION",
  DIRECT_WITH_INPUT = "DIRECT_WITH_INPUT",
  EXTERNAL_REGISTRATION = "EXTERNAL_REGISTRATION",
}

/**
 * update columns of table "CourseRegistrationType"
 */
export enum CourseRegistrationType_update_column {
  comment = "comment",
  value = "value",
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
 * select columns of table "Course"
 */
export enum Course_select_column {
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
  externalRegistrationLink = "externalRegistrationLink",
  formbricksEnrollmentSurveyUrl = "formbricksEnrollmentSurveyUrl",
  headingDescriptionField1 = "headingDescriptionField1",
  headingDescriptionField2 = "headingDescriptionField2",
  id = "id",
  language = "language",
  learningGoals = "learningGoals",
  maxMissedSessions = "maxMissedSessions",
  maxParticipants = "maxParticipants",
  programId = "programId",
  published = "published",
  registrationType = "registrationType",
  startTime = "startTime",
  status = "status",
  tagline = "tagline",
  title = "title",
  updated_at = "updated_at",
  weekDay = "weekDay",
}

/**
 * select "Course_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Course"
 */
export enum Course_select_column_Course_aggregate_bool_exp_bool_and_arguments_columns {
  achievementCertificatePossible = "achievementCertificatePossible",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  published = "published",
}

/**
 * select "Course_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Course"
 */
export enum Course_select_column_Course_aggregate_bool_exp_bool_or_arguments_columns {
  achievementCertificatePossible = "achievementCertificatePossible",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  published = "published",
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
  externalRegistrationLink = "externalRegistrationLink",
  formbricksEnrollmentSurveyUrl = "formbricksEnrollmentSurveyUrl",
  headingDescriptionField1 = "headingDescriptionField1",
  headingDescriptionField2 = "headingDescriptionField2",
  id = "id",
  language = "language",
  learningGoals = "learningGoals",
  maxMissedSessions = "maxMissedSessions",
  maxParticipants = "maxParticipants",
  programId = "programId",
  published = "published",
  registrationType = "registrationType",
  startTime = "startTime",
  status = "status",
  tagline = "tagline",
  title = "title",
  updated_at = "updated_at",
  weekDay = "weekDay",
}

/**
 * unique or primary key constraints on table "Language"
 */
export enum Language_constraint {
  Languages_pkey = "Languages_pkey",
}

/**
 * update columns of table "Language"
 */
export enum Language_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "LocationAddress"
 */
export enum LocationAddress_constraint {
  LocationAddress_locationOptionId_shortLabel_key = "LocationAddress_locationOptionId_shortLabel_key",
  LocationAddress_pkey = "LocationAddress_pkey",
}

/**
 * select columns of table "LocationAddress"
 */
export enum LocationAddress_select_column {
  address = "address",
  aliases = "aliases",
  created_at = "created_at",
  description = "description",
  id = "id",
  locationOption = "locationOption",
  shortLabel = "shortLabel",
  updated_at = "updated_at",
}

/**
 * update columns of table "LocationAddress"
 */
export enum LocationAddress_update_column {
  address = "address",
  aliases = "aliases",
  created_at = "created_at",
  description = "description",
  id = "id",
  locationOption = "locationOption",
  shortLabel = "shortLabel",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "LocationOption"
 */
export enum LocationOption_constraint {
  LocationOptions_pkey = "LocationOptions_pkey",
}

export enum LocationOption_enum {
  HEIDE = "HEIDE",
  KIEL = "KIEL",
  ONLINE = "ONLINE",
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
 * unique or primary key constraints on table "OrganizationAdmin"
 */
export enum OrganizationAdmin_constraint {
  OrganizationAdmin_pkey = "OrganizationAdmin_pkey",
  OrganizationAdmin_userId_organizationId_key = "OrganizationAdmin_userId_organizationId_key",
}

/**
 * select columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_select_column {
  canManageCourses = "canManageCourses",
  canManageEvents = "canManageEvents",
  canManageSettings = "canManageSettings",
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * select "OrganizationAdmin_aggregate_bool_exp_bool_and_arguments_columns" columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_select_column_OrganizationAdmin_aggregate_bool_exp_bool_and_arguments_columns {
  canManageCourses = "canManageCourses",
  canManageEvents = "canManageEvents",
  canManageSettings = "canManageSettings",
}

/**
 * select "OrganizationAdmin_aggregate_bool_exp_bool_or_arguments_columns" columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_select_column_OrganizationAdmin_aggregate_bool_exp_bool_or_arguments_columns {
  canManageCourses = "canManageCourses",
  canManageEvents = "canManageEvents",
  canManageSettings = "canManageSettings",
}

/**
 * update columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_update_column {
  canManageCourses = "canManageCourses",
  canManageEvents = "canManageEvents",
  canManageSettings = "canManageSettings",
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "OrganizationType"
 */
export enum OrganizationType_constraint {
  OrganizationType_pkey = "OrganizationType_pkey",
}

export enum OrganizationType_enum {
  CORPORATION = "CORPORATION",
  FREELANCER = "FREELANCER",
  NON_PROFIT_ORGANIZATION = "NON_PROFIT_ORGANIZATION",
  OTHER = "OTHER",
  PUBLIC_SECTOR = "PUBLIC_SECTOR",
  RESEARCH_INSTITUTE = "RESEARCH_INSTITUTE",
  SCHOOL = "SCHOOL",
  UNIVERSITY = "UNIVERSITY",
}

/**
 * update columns of table "OrganizationType"
 */
export enum OrganizationType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Organization"
 */
export enum Organization_constraint {
  Organization_name_key = "Organization_name_key",
  Organization_pkey = "Organization_pkey",
}

/**
 * select columns of table "Organization"
 */
export enum Organization_select_column {
  aliases = "aliases",
  apiKeyHash = "apiKeyHash",
  created_at = "created_at",
  description = "description",
  id = "id",
  logo = "logo",
  name = "name",
  type = "type",
  updated_at = "updated_at",
}

/**
 * update columns of table "Organization"
 */
export enum Organization_update_column {
  aliases = "aliases",
  apiKeyHash = "apiKeyHash",
  created_at = "created_at",
  description = "description",
  id = "id",
  logo = "logo",
  name = "name",
  type = "type",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProgramType"
 */
export enum ProgramType_constraint {
  ProgramType_pkey = "ProgramType_pkey",
}

export enum ProgramType_enum {
  COURSES = "COURSES",
  DEGREES = "DEGREES",
  EVENTS = "EVENTS",
  RENT_A_SCIENTIST = "RENT_A_SCIENTIST",
}

/**
 * update columns of table "ProgramType"
 */
export enum ProgramType_update_column {
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
 * select columns of table "Program"
 */
export enum Program_select_column {
  achievementCertificateTemplateTextId = "achievementCertificateTemplateTextId",
  achievementCertificateTemplateURL = "achievementCertificateTemplateURL",
  achievementRecordUploadDeadline = "achievementRecordUploadDeadline",
  applicationStart = "applicationStart",
  attendanceCertificateTemplateTextId = "attendanceCertificateTemplateTextId",
  attendanceCertificateTemplateURL = "attendanceCertificateTemplateURL",
  closingQuestionnaire = "closingQuestionnaire",
  defaultApplicationEnd = "defaultApplicationEnd",
  defaultFormbricksEnrollmentSurveyUrl = "defaultFormbricksEnrollmentSurveyUrl",
  defaultMaxMissedSessions = "defaultMaxMissedSessions",
  id = "id",
  lectureEnd = "lectureEnd",
  lectureStart = "lectureStart",
  published = "published",
  shortTitle = "shortTitle",
  speakerQuestionnaire = "speakerQuestionnaire",
  startQuestionnaire = "startQuestionnaire",
  title = "title",
  type = "type",
  visibility = "visibility",
  visibilityAchievementCertificate = "visibilityAchievementCertificate",
  visibilityAttendanceCertificate = "visibilityAttendanceCertificate",
}

/**
 * select "Program_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Program"
 */
export enum Program_select_column_Program_aggregate_bool_exp_bool_and_arguments_columns {
  published = "published",
  visibility = "visibility",
  visibilityAchievementCertificate = "visibilityAchievementCertificate",
  visibilityAttendanceCertificate = "visibilityAttendanceCertificate",
}

/**
 * select "Program_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Program"
 */
export enum Program_select_column_Program_aggregate_bool_exp_bool_or_arguments_columns {
  published = "published",
  visibility = "visibility",
  visibilityAchievementCertificate = "visibilityAchievementCertificate",
  visibilityAttendanceCertificate = "visibilityAttendanceCertificate",
}

/**
 * update columns of table "Program"
 */
export enum Program_update_column {
  achievementCertificateTemplateTextId = "achievementCertificateTemplateTextId",
  achievementCertificateTemplateURL = "achievementCertificateTemplateURL",
  achievementRecordUploadDeadline = "achievementRecordUploadDeadline",
  applicationStart = "applicationStart",
  attendanceCertificateTemplateTextId = "attendanceCertificateTemplateTextId",
  attendanceCertificateTemplateURL = "attendanceCertificateTemplateURL",
  closingQuestionnaire = "closingQuestionnaire",
  defaultApplicationEnd = "defaultApplicationEnd",
  defaultFormbricksEnrollmentSurveyUrl = "defaultFormbricksEnrollmentSurveyUrl",
  defaultMaxMissedSessions = "defaultMaxMissedSessions",
  id = "id",
  lectureEnd = "lectureEnd",
  lectureStart = "lectureStart",
  published = "published",
  shortTitle = "shortTitle",
  speakerQuestionnaire = "speakerQuestionnaire",
  startQuestionnaire = "startQuestionnaire",
  title = "title",
  type = "type",
  visibility = "visibility",
  visibilityAchievementCertificate = "visibilityAchievementCertificate",
  visibilityAttendanceCertificate = "visibilityAttendanceCertificate",
}

/**
 * unique or primary key constraints on table "rentAScientist.RentAScientistConfig"
 */
export enum RentAScientistConfig_constraint {
  RentAScientistConfig_pkey = "RentAScientistConfig_pkey",
}

/**
 * select columns of table "rentAScientist.RentAScientistConfig"
 */
export enum RentAScientistConfig_select_column {
  id = "id",
  mailFrom = "mailFrom",
  program_id = "program_id",
  test_operation = "test_operation",
}

/**
 * select "RentAScientistConfig_aggregate_bool_exp_bool_and_arguments_columns" columns of table "rentAScientist.RentAScientistConfig"
 */
export enum RentAScientistConfig_select_column_RentAScientistConfig_aggregate_bool_exp_bool_and_arguments_columns {
  test_operation = "test_operation",
}

/**
 * select "RentAScientistConfig_aggregate_bool_exp_bool_or_arguments_columns" columns of table "rentAScientist.RentAScientistConfig"
 */
export enum RentAScientistConfig_select_column_RentAScientistConfig_aggregate_bool_exp_bool_or_arguments_columns {
  test_operation = "test_operation",
}

/**
 * update columns of table "rentAScientist.RentAScientistConfig"
 */
export enum RentAScientistConfig_update_column {
  id = "id",
  mailFrom = "mailFrom",
  program_id = "program_id",
  test_operation = "test_operation",
}

/**
 * unique or primary key constraints on table "rentAScientist.SchoolClassRequest"
 */
export enum SchoolClassRequest_constraint {
  SchoolClassRequest_pkey = "SchoolClassRequest_pkey",
}

/**
 * select columns of table "rentAScientist.SchoolClassRequest"
 */
export enum SchoolClassRequest_select_column {
  assigned_day = "assigned_day",
  classId = "classId",
  commentGeneral = "commentGeneral",
  commentTime = "commentTime",
  id = "id",
  offerId = "offerId",
  possibleDays = "possibleDays",
}

/**
 * update columns of table "rentAScientist.SchoolClassRequest"
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
 * unique or primary key constraints on table "rentAScientist.SchoolClass"
 */
export enum SchoolClass_constraint {
  SchoolClass_pkey = "SchoolClass_pkey",
}

/**
 * select columns of table "rentAScientist.SchoolClass"
 */
export enum SchoolClass_select_column {
  contact = "contact",
  grade = "grade",
  id = "id",
  name = "name",
  schoolId = "schoolId",
  studensCount = "studensCount",
  teacherId = "teacherId",
}

/**
 * update columns of table "rentAScientist.SchoolClass"
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
 * unique or primary key constraints on table "rentAScientist.School"
 */
export enum School_constraint {
  School_pkey = "School_pkey",
}

/**
 * update columns of table "rentAScientist.School"
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
 * unique or primary key constraints on table "rentAScientist.ScientistOfferRelation"
 */
export enum ScientistOfferRelation_constraint {
  ScientistOfferRelation_pkey = "ScientistOfferRelation_pkey",
}

/**
 * select columns of table "rentAScientist.ScientistOfferRelation"
 */
export enum ScientistOfferRelation_select_column {
  offerId = "offerId",
  scientistId = "scientistId",
}

/**
 * update columns of table "rentAScientist.ScientistOfferRelation"
 */
export enum ScientistOfferRelation_update_column {
  offerId = "offerId",
  scientistId = "scientistId",
}

/**
 * unique or primary key constraints on table "rentAScientist.ScientistOffer"
 */
export enum ScientistOffer_constraint {
  ScientistOffer_pkey = "ScientistOffer_pkey",
}

/**
 * select columns of table "rentAScientist.ScientistOffer"
 */
export enum ScientistOffer_select_column {
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
 * update columns of table "rentAScientist.ScientistOffer"
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
 * unique or primary key constraints on table "rentAScientist.Scientist"
 */
export enum Scientist_constraint {
  Scientist_pkey = "Scientist_pkey",
}

/**
 * update columns of table "rentAScientist.Scientist"
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
 * select columns of table "SessionAddress"
 */
export enum SessionAddress_select_column {
  address = "address",
  courseLocationId = "courseLocationId",
  created_at = "created_at",
  id = "id",
  locationAddressId = "locationAddressId",
  sessionId = "sessionId",
  updated_at = "updated_at",
}

/**
 * update columns of table "SessionAddress"
 */
export enum SessionAddress_update_column {
  address = "address",
  courseLocationId = "courseLocationId",
  created_at = "created_at",
  id = "id",
  locationAddressId = "locationAddressId",
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
 * select columns of table "SessionSpeaker"
 */
export enum SessionSpeaker_select_column {
  created_at = "created_at",
  id = "id",
  sessionId = "sessionId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "SessionSpeaker"
 */
export enum SessionSpeaker_update_column {
  created_at = "created_at",
  id = "id",
  sessionId = "sessionId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "Session"
 */
export enum Session_constraint {
  Date_pkey = "Date_pkey",
}

/**
 * select columns of table "Session"
 */
export enum Session_select_column {
  attendanceData = "attendanceData",
  courseId = "courseId",
  created_at = "created_at",
  description = "description",
  endDateTime = "endDateTime",
  id = "id",
  questionaire_sent = "questionaire_sent",
  startDateTime = "startDateTime",
  title = "title",
  updated_at = "updated_at",
}

/**
 * select "Session_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Session"
 */
export enum Session_select_column_Session_aggregate_bool_exp_bool_and_arguments_columns {
  questionaire_sent = "questionaire_sent",
}

/**
 * select "Session_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Session"
 */
export enum Session_select_column_Session_aggregate_bool_exp_bool_or_arguments_columns {
  questionaire_sent = "questionaire_sent",
}

/**
 * update columns of table "Session"
 */
export enum Session_update_column {
  attendanceData = "attendanceData",
  courseId = "courseId",
  created_at = "created_at",
  description = "description",
  endDateTime = "endDateTime",
  id = "id",
  questionaire_sent = "questionaire_sent",
  startDateTime = "startDateTime",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "rentAScientist.Teacher"
 */
export enum Teacher_constraint {
  Teacher_pkey = "Teacher_pkey",
  Teacher_userId_key = "Teacher_userId_key",
}

/**
 * update columns of table "rentAScientist.Teacher"
 */
export enum Teacher_update_column {
  id = "id",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "UserOccupation"
 */
export enum UserOccupation_constraint {
  UserOccupation_pkey = "UserOccupation_pkey",
}

export enum UserOccupation_enum {
  EDUCATOR = "EDUCATOR",
  EMPLOYED_FULL_TIME = "EMPLOYED_FULL_TIME",
  EMPLOYED_PART_TIME = "EMPLOYED_PART_TIME",
  HIGH_SCHOOL_STUDENT = "HIGH_SCHOOL_STUDENT",
  HOMEMAKER = "HOMEMAKER",
  OTHER = "OTHER",
  RESEARCHER = "RESEARCHER",
  RETIRED = "RETIRED",
  SELF_EMPLOYED = "SELF_EMPLOYED",
  UNEMPLOYED = "UNEMPLOYED",
  UNIVERSITY_STUDENT = "UNIVERSITY_STUDENT",
}

/**
 * update columns of table "UserOccupation"
 */
export enum UserOccupation_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "UserStatus"
 */
export enum UserStatus_constraint {
  UserStatus_pkey = "UserStatus_pkey",
}

export enum UserStatus_enum {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
  INACTIVE = "INACTIVE",
  SPAM = "SPAM",
}

/**
 * update columns of table "UserStatus"
 */
export enum UserStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "User"
 */
export enum User_constraint {
  Person_AnonymId_key = "Person_AnonymId_key",
  User_email_key = "User_email_key",
  User_pkey = "User_pkey",
}

/**
 * select columns of table "User"
 */
export enum User_select_column {
  anonymousId = "anonymousId",
  country = "country",
  created_at = "created_at",
  email = "email",
  externalProfile = "externalProfile",
  firstName = "firstName",
  id = "id",
  integerId = "integerId",
  lastName = "lastName",
  matriculationNumber = "matriculationNumber",
  newsletterRegistration = "newsletterRegistration",
  occupation = "occupation",
  organizationId = "organizationId",
  picture = "picture",
  status = "status",
  updated_at = "updated_at",
  zipCode = "zipCode",
}

/**
 * select "User_aggregate_bool_exp_bool_and_arguments_columns" columns of table "User"
 */
export enum User_select_column_User_aggregate_bool_exp_bool_and_arguments_columns {
  newsletterRegistration = "newsletterRegistration",
}

/**
 * select "User_aggregate_bool_exp_bool_or_arguments_columns" columns of table "User"
 */
export enum User_select_column_User_aggregate_bool_exp_bool_or_arguments_columns {
  newsletterRegistration = "newsletterRegistration",
}

/**
 * update columns of table "User"
 */
export enum User_update_column {
  anonymousId = "anonymousId",
  country = "country",
  created_at = "created_at",
  email = "email",
  externalProfile = "externalProfile",
  firstName = "firstName",
  id = "id",
  integerId = "integerId",
  lastName = "lastName",
  matriculationNumber = "matriculationNumber",
  newsletterRegistration = "newsletterRegistration",
  occupation = "occupation",
  organizationId = "organizationId",
  picture = "picture",
  status = "status",
  updated_at = "updated_at",
  zipCode = "zipCode",
}

/**
 * unique or primary key constraints on table "Weekday"
 */
export enum Weekday_constraint {
  Weekday_pkey = "Weekday_pkey",
}

export enum Weekday_enum {
  FRIDAY = "FRIDAY",
  MONDAY = "MONDAY",
  NONE = "NONE",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
  THURSDAY = "THURSDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
}

/**
 * update columns of table "Weekday"
 */
export enum Weekday_update_column {
  comment = "comment",
  value = "value",
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
 * Boolean expression to filter rows from the table "AchievementDocumentationTemplate". All fields are combined with a logical 'AND'.
 */
export interface AchievementDocumentationTemplate_bool_exp {
  _and?: AchievementDocumentationTemplate_bool_exp[] | null;
  _not?: AchievementDocumentationTemplate_bool_exp | null;
  _or?: AchievementDocumentationTemplate_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  url?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementDocumentationTemplate"
 */
export interface AchievementDocumentationTemplate_insert_input {
  created_at?: any | null;
  id?: number | null;
  title?: string | null;
  updated_at?: any | null;
  url?: string | null;
}

/**
 * input type for inserting object relation for remote table "AchievementDocumentationTemplate"
 */
export interface AchievementDocumentationTemplate_obj_rel_insert_input {
  data: AchievementDocumentationTemplate_insert_input;
  on_conflict?: AchievementDocumentationTemplate_on_conflict | null;
}

/**
 * on_conflict condition type for table "AchievementDocumentationTemplate"
 */
export interface AchievementDocumentationTemplate_on_conflict {
  constraint: AchievementDocumentationTemplate_constraint;
  update_columns: AchievementDocumentationTemplate_update_column[];
  where?: AchievementDocumentationTemplate_bool_exp | null;
}

/**
 * Ordering options when selecting data from "AchievementDocumentationTemplate".
 */
export interface AchievementDocumentationTemplate_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  url?: order_by | null;
}

export interface AchievementOptionCourse_aggregate_bool_exp {
  count?: AchievementOptionCourse_aggregate_bool_exp_count | null;
}

export interface AchievementOptionCourse_aggregate_bool_exp_count {
  arguments?: AchievementOptionCourse_select_column[] | null;
  distinct?: boolean | null;
  filter?: AchievementOptionCourse_bool_exp | null;
  predicate: Int_comparison_exp;
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

export interface AchievementOptionMentor_aggregate_bool_exp {
  count?: AchievementOptionMentor_aggregate_bool_exp_count | null;
}

export interface AchievementOptionMentor_aggregate_bool_exp_count {
  arguments?: AchievementOptionMentor_select_column[] | null;
  distinct?: boolean | null;
  filter?: AchievementOptionMentor_bool_exp | null;
  predicate: Int_comparison_exp;
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
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementOptionMentor". All fields are combined with a logical 'AND'.
 */
export interface AchievementOptionMentor_bool_exp {
  AchievementOption?: AchievementOption_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: AchievementOptionMentor_bool_exp[] | null;
  _not?: AchievementOptionMentor_bool_exp | null;
  _or?: AchievementOptionMentor_bool_exp[] | null;
  achievementOptionId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_insert_input {
  AchievementOption?: AchievementOption_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  achievementOptionId?: number | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_max_order_by {
  achievementOptionId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_min_order_by {
  achievementOptionId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_pop_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_stddev_samp_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_sum_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_var_pop_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_var_samp_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementOptionMentor"
 */
export interface AchievementOptionMentor_variance_order_by {
  achievementOptionId?: order_by | null;
  id?: order_by | null;
}

export interface AchievementOption_aggregate_bool_exp {
  bool_and?: AchievementOption_aggregate_bool_exp_bool_and | null;
  bool_or?: AchievementOption_aggregate_bool_exp_bool_or | null;
  count?: AchievementOption_aggregate_bool_exp_count | null;
}

export interface AchievementOption_aggregate_bool_exp_bool_and {
  arguments: AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: AchievementOption_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface AchievementOption_aggregate_bool_exp_bool_or {
  arguments: AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: AchievementOption_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface AchievementOption_aggregate_bool_exp_count {
  arguments?: AchievementOption_select_column[] | null;
  distinct?: boolean | null;
  filter?: AchievementOption_bool_exp | null;
  predicate: Int_comparison_exp;
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
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementOption". All fields are combined with a logical 'AND'.
 */
export interface AchievementOption_bool_exp {
  AchievementOptionCourses?: AchievementOptionCourse_bool_exp | null;
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_bool_exp | null;
  AchievementOptionMentors?: AchievementOptionMentor_bool_exp | null;
  AchievementOptionMentors_aggregate?: AchievementOptionMentor_aggregate_bool_exp | null;
  AchievementOptionTemplate?: AchievementDocumentationTemplate_bool_exp | null;
  AchievementRecordType?: AchievementRecordType_bool_exp | null;
  AchievementRecords?: AchievementRecord_bool_exp | null;
  AchievementRecords_aggregate?: AchievementRecord_aggregate_bool_exp | null;
  _and?: AchievementOption_bool_exp[] | null;
  _not?: AchievementOption_bool_exp | null;
  _or?: AchievementOption_bool_exp[] | null;
  achievementDocumentationTemplateId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  csvTemplateUrl?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  evaluationScriptUrl?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  recordType?: AchievementRecordType_enum_comparison_exp | null;
  showScoreAuthors?: Boolean_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementOption"
 */
export interface AchievementOption_insert_input {
  AchievementOptionCourses?: AchievementOptionCourse_arr_rel_insert_input | null;
  AchievementOptionMentors?: AchievementOptionMentor_arr_rel_insert_input | null;
  AchievementOptionTemplate?: AchievementDocumentationTemplate_obj_rel_insert_input | null;
  AchievementRecordType?: AchievementRecordType_obj_rel_insert_input | null;
  AchievementRecords?: AchievementRecord_arr_rel_insert_input | null;
  achievementDocumentationTemplateId?: number | null;
  created_at?: any | null;
  csvTemplateUrl?: string | null;
  description?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  published?: boolean | null;
  recordType?: AchievementRecordType_enum | null;
  showScoreAuthors?: boolean | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "AchievementOption"
 */
export interface AchievementOption_max_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  created_at?: order_by | null;
  csvTemplateUrl?: order_by | null;
  description?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementOption"
 */
export interface AchievementOption_min_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  created_at?: order_by | null;
  csvTemplateUrl?: order_by | null;
  description?: order_by | null;
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
  AchievementOptionTemplate?: AchievementDocumentationTemplate_order_by | null;
  AchievementRecordType?: AchievementRecordType_order_by | null;
  AchievementRecords_aggregate?: AchievementRecord_aggregate_order_by | null;
  achievementDocumentationTemplateId?: order_by | null;
  created_at?: order_by | null;
  csvTemplateUrl?: order_by | null;
  description?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  published?: order_by | null;
  recordType?: order_by | null;
  showScoreAuthors?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for updating data in table "AchievementOption"
 */
export interface AchievementOption_set_input {
  achievementDocumentationTemplateId?: number | null;
  created_at?: any | null;
  csvTemplateUrl?: string | null;
  description?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  published?: boolean | null;
  recordType?: AchievementRecordType_enum | null;
  showScoreAuthors?: boolean | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_pop_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementOption"
 */
export interface AchievementOption_stddev_samp_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementOption"
 */
export interface AchievementOption_sum_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementOption"
 */
export interface AchievementOption_var_pop_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementOption"
 */
export interface AchievementOption_var_samp_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementOption"
 */
export interface AchievementOption_variance_order_by {
  achievementDocumentationTemplateId?: order_by | null;
  id?: order_by | null;
}

export interface AchievementRecordAuthor_aggregate_bool_exp {
  count?: AchievementRecordAuthor_aggregate_bool_exp_count | null;
}

export interface AchievementRecordAuthor_aggregate_bool_exp_count {
  arguments?: AchievementRecordAuthor_select_column[] | null;
  distinct?: boolean | null;
  filter?: AchievementRecordAuthor_bool_exp | null;
  predicate: Int_comparison_exp;
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
 * Ordering options when selecting data from "AchievementRecordAuthor".
 */
export interface AchievementRecordAuthor_order_by {
  AchievementRecord?: AchievementRecord_order_by | null;
  User?: User_order_by | null;
  achievementRecordId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
  AchievementRecords_aggregate?: AchievementRecord_aggregate_bool_exp | null;
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
 * Ordering options when selecting data from "AchievementRecordRating".
 */
export interface AchievementRecordRating_order_by {
  AchievementRecords_aggregate?: AchievementRecord_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecordType". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecordType_bool_exp {
  AchievementOptions?: AchievementOption_bool_exp | null;
  AchievementOptions_aggregate?: AchievementOption_aggregate_bool_exp | null;
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

export interface AchievementRecord_aggregate_bool_exp {
  count?: AchievementRecord_aggregate_bool_exp_count | null;
}

export interface AchievementRecord_aggregate_bool_exp_count {
  arguments?: AchievementRecord_select_column[] | null;
  distinct?: boolean | null;
  filter?: AchievementRecord_bool_exp | null;
  predicate: Int_comparison_exp;
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
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AchievementRecord". All fields are combined with a logical 'AND'.
 */
export interface AchievementRecord_bool_exp {
  AchievementOption?: AchievementOption_bool_exp | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_bool_exp | null;
  AchievementRecordAuthors_aggregate?: AchievementRecordAuthor_aggregate_bool_exp | null;
  AchievementRecordRating?: AchievementRecordRating_bool_exp | null;
  _and?: AchievementRecord_bool_exp[] | null;
  _not?: AchievementRecord_bool_exp | null;
  _or?: AchievementRecord_bool_exp[] | null;
  achievementOptionId?: Int_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  coverImageUrl?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  csvResults?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  documentationUrl?: String_comparison_exp | null;
  evaluationScriptUrl?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  rating?: AchievementRecordRating_enum_comparison_exp | null;
  score?: numeric_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  uploadUserId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "AchievementRecord"
 */
export interface AchievementRecord_insert_input {
  AchievementOption?: AchievementOption_obj_rel_insert_input | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_arr_rel_insert_input | null;
  AchievementRecordRating?: AchievementRecordRating_obj_rel_insert_input | null;
  achievementOptionId?: number | null;
  courseId?: number | null;
  coverImageUrl?: string | null;
  created_at?: any | null;
  csvResults?: string | null;
  description?: string | null;
  documentationUrl?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  rating?: AchievementRecordRating_enum | null;
  score?: any | null;
  updated_at?: any | null;
  uploadUserId?: any | null;
}

/**
 * order by max() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_max_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  updated_at?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * order by min() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_min_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
  updated_at?: order_by | null;
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
 * Ordering options when selecting data from "AchievementRecord".
 */
export interface AchievementRecord_order_by {
  AchievementOption?: AchievementOption_order_by | null;
  AchievementRecordAuthors_aggregate?: AchievementRecordAuthor_aggregate_order_by | null;
  AchievementRecordRating?: AchievementRecordRating_order_by | null;
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationUrl?: order_by | null;
  evaluationScriptUrl?: order_by | null;
  id?: order_by | null;
  rating?: order_by | null;
  score?: order_by | null;
  updated_at?: order_by | null;
  uploadUserId?: order_by | null;
}

/**
 * input type for updating data in table "AchievementRecord"
 */
export interface AchievementRecord_set_input {
  achievementOptionId?: number | null;
  courseId?: number | null;
  coverImageUrl?: string | null;
  created_at?: any | null;
  csvResults?: string | null;
  description?: string | null;
  documentationUrl?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  rating?: AchievementRecordRating_enum | null;
  score?: any | null;
  updated_at?: any | null;
  uploadUserId?: any | null;
}

/**
 * order by stddev() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_pop_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_stddev_samp_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by sum() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_sum_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by var_pop() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_var_pop_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by var_samp() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_var_samp_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * order by variance() on columns of table "AchievementRecord"
 */
export interface AchievementRecord_variance_order_by {
  achievementOptionId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
  score?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "AttendanceSource". All fields are combined with a logical 'AND'.
 */
export interface AttendanceSource_bool_exp {
  Attendances?: Attendance_bool_exp | null;
  Attendances_aggregate?: Attendance_aggregate_bool_exp | null;
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
  Attendances_aggregate?: Attendance_aggregate_bool_exp | null;
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

export interface Attendance_aggregate_bool_exp {
  count?: Attendance_aggregate_bool_exp_count | null;
}

export interface Attendance_aggregate_bool_exp_count {
  arguments?: Attendance_select_column[] | null;
  distinct?: boolean | null;
  filter?: Attendance_bool_exp | null;
  predicate: Int_comparison_exp;
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
  location?: String_comparison_exp | null;
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
  location?: string | null;
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
  location?: order_by | null;
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
  location?: order_by | null;
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
  location?: string | null;
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

export interface CertificateTemplateProgram_aggregate_bool_exp {
  count?: CertificateTemplateProgram_aggregate_bool_exp_count | null;
}

export interface CertificateTemplateProgram_aggregate_bool_exp_count {
  arguments?: CertificateTemplateProgram_select_column[] | null;
  distinct?: boolean | null;
  filter?: CertificateTemplateProgram_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_aggregate_order_by {
  avg?: CertificateTemplateProgram_avg_order_by | null;
  count?: order_by | null;
  max?: CertificateTemplateProgram_max_order_by | null;
  min?: CertificateTemplateProgram_min_order_by | null;
  stddev?: CertificateTemplateProgram_stddev_order_by | null;
  stddev_pop?: CertificateTemplateProgram_stddev_pop_order_by | null;
  stddev_samp?: CertificateTemplateProgram_stddev_samp_order_by | null;
  sum?: CertificateTemplateProgram_sum_order_by | null;
  var_pop?: CertificateTemplateProgram_var_pop_order_by | null;
  var_samp?: CertificateTemplateProgram_var_samp_order_by | null;
  variance?: CertificateTemplateProgram_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_arr_rel_insert_input {
  data: CertificateTemplateProgram_insert_input[];
  on_conflict?: CertificateTemplateProgram_on_conflict | null;
}

/**
 * order by avg() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_avg_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CertificateTemplateProgram". All fields are combined with a logical 'AND'.
 */
export interface CertificateTemplateProgram_bool_exp {
  CertificateTemplateText?: CertificateTemplateText_bool_exp | null;
  Program?: Program_bool_exp | null;
  _and?: CertificateTemplateProgram_bool_exp[] | null;
  _not?: CertificateTemplateProgram_bool_exp | null;
  _or?: CertificateTemplateProgram_bool_exp[] | null;
  certificateTemplateText?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  programId?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_insert_input {
  CertificateTemplateText?: CertificateTemplateText_obj_rel_insert_input | null;
  Program?: Program_obj_rel_insert_input | null;
  certificateTemplateText?: number | null;
  id?: number | null;
  programId?: number | null;
}

/**
 * order by max() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_max_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by min() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_min_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * on_conflict condition type for table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_on_conflict {
  constraint: CertificateTemplateProgram_constraint;
  update_columns: CertificateTemplateProgram_update_column[];
  where?: CertificateTemplateProgram_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_stddev_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_stddev_pop_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_stddev_samp_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by sum() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_sum_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_var_pop_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_var_samp_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by variance() on columns of table "CertificateTemplateProgram"
 */
export interface CertificateTemplateProgram_variance_order_by {
  certificateTemplateText?: order_by | null;
  id?: order_by | null;
  programId?: order_by | null;
}

export interface CertificateTemplateText_aggregate_bool_exp {
  count?: CertificateTemplateText_aggregate_bool_exp_count | null;
}

export interface CertificateTemplateText_aggregate_bool_exp_count {
  arguments?: CertificateTemplateText_select_column[] | null;
  distinct?: boolean | null;
  filter?: CertificateTemplateText_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "CertificateTemplateText"
 */
export interface CertificateTemplateText_arr_rel_insert_input {
  data: CertificateTemplateText_insert_input[];
  on_conflict?: CertificateTemplateText_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "CertificateTemplateText". All fields are combined with a logical 'AND'.
 */
export interface CertificateTemplateText_bool_exp {
  AchievementRecordType?: AchievementRecordType_bool_exp | null;
  CertificateTemplatePrograms?: CertificateTemplateProgram_bool_exp | null;
  CertificateTemplatePrograms_aggregate?: CertificateTemplateProgram_aggregate_bool_exp | null;
  CertificateType?: CertificateType_bool_exp | null;
  Programs?: Program_bool_exp | null;
  Programs_aggregate?: Program_aggregate_bool_exp | null;
  _and?: CertificateTemplateText_bool_exp[] | null;
  _not?: CertificateTemplateText_bool_exp | null;
  _or?: CertificateTemplateText_bool_exp[] | null;
  certificateType?: CertificateType_enum_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  html?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  programsByAttendancecertificatetemplatetextid?: Program_bool_exp | null;
  programsByAttendancecertificatetemplatetextid_aggregate?: Program_aggregate_bool_exp | null;
  recordType?: AchievementRecordType_enum_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CertificateTemplateText"
 */
export interface CertificateTemplateText_insert_input {
  AchievementRecordType?: AchievementRecordType_obj_rel_insert_input | null;
  CertificateTemplatePrograms?: CertificateTemplateProgram_arr_rel_insert_input | null;
  CertificateType?: CertificateType_obj_rel_insert_input | null;
  Programs?: Program_arr_rel_insert_input | null;
  certificateType?: CertificateType_enum | null;
  created_at?: any | null;
  html?: string | null;
  id?: number | null;
  programsByAttendancecertificatetemplatetextid?: Program_arr_rel_insert_input | null;
  recordType?: AchievementRecordType_enum | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "CertificateTemplateText"
 */
export interface CertificateTemplateText_obj_rel_insert_input {
  data: CertificateTemplateText_insert_input;
  on_conflict?: CertificateTemplateText_on_conflict | null;
}

/**
 * on_conflict condition type for table "CertificateTemplateText"
 */
export interface CertificateTemplateText_on_conflict {
  constraint: CertificateTemplateText_constraint;
  update_columns: CertificateTemplateText_update_column[];
  where?: CertificateTemplateText_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "CertificateType". All fields are combined with a logical 'AND'.
 */
export interface CertificateType_bool_exp {
  CertificateTemplateTexts?: CertificateTemplateText_bool_exp | null;
  CertificateTemplateTexts_aggregate?: CertificateTemplateText_aggregate_bool_exp | null;
  _and?: CertificateType_bool_exp[] | null;
  _not?: CertificateType_bool_exp | null;
  _or?: CertificateType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "CertificateType_enum". All fields are combined with logical 'AND'.
 */
export interface CertificateType_enum_comparison_exp {
  _eq?: CertificateType_enum | null;
  _in?: CertificateType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: CertificateType_enum | null;
  _nin?: CertificateType_enum[] | null;
}

/**
 * input type for inserting data into table "CertificateType"
 */
export interface CertificateType_insert_input {
  CertificateTemplateTexts?: CertificateTemplateText_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "CertificateType"
 */
export interface CertificateType_obj_rel_insert_input {
  data: CertificateType_insert_input;
  on_conflict?: CertificateType_on_conflict | null;
}

/**
 * on_conflict condition type for table "CertificateType"
 */
export interface CertificateType_on_conflict {
  constraint: CertificateType_constraint;
  update_columns: CertificateType_update_column[];
  where?: CertificateType_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "Country". All fields are combined with a logical 'AND'.
 */
export interface Country_bool_exp {
  Users?: User_bool_exp | null;
  Users_aggregate?: User_aggregate_bool_exp | null;
  _and?: Country_bool_exp[] | null;
  _not?: Country_bool_exp | null;
  _or?: Country_bool_exp[] | null;
  code?: String_comparison_exp | null;
  name_de?: String_comparison_exp | null;
  name_en?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Country"
 */
export interface Country_insert_input {
  Users?: User_arr_rel_insert_input | null;
  code?: string | null;
  name_de?: string | null;
  name_en?: string | null;
}

/**
 * input type for inserting object relation for remote table "Country"
 */
export interface Country_obj_rel_insert_input {
  data: Country_insert_input;
  on_conflict?: Country_on_conflict | null;
}

/**
 * on_conflict condition type for table "Country"
 */
export interface Country_on_conflict {
  constraint: Country_constraint;
  update_columns: Country_update_column[];
  where?: Country_bool_exp | null;
}

/**
 * Ordering options when selecting data from "Country".
 */
export interface Country_order_by {
  Users_aggregate?: User_aggregate_order_by | null;
  code?: order_by | null;
  name_de?: order_by | null;
  name_en?: order_by | null;
}

export interface CourseDegree_aggregate_bool_exp {
  count?: CourseDegree_aggregate_bool_exp_count | null;
}

export interface CourseDegree_aggregate_bool_exp_count {
  arguments?: CourseDegree_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseDegree_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CourseDegree"
 */
export interface CourseDegree_aggregate_order_by {
  avg?: CourseDegree_avg_order_by | null;
  count?: order_by | null;
  max?: CourseDegree_max_order_by | null;
  min?: CourseDegree_min_order_by | null;
  stddev?: CourseDegree_stddev_order_by | null;
  stddev_pop?: CourseDegree_stddev_pop_order_by | null;
  stddev_samp?: CourseDegree_stddev_samp_order_by | null;
  sum?: CourseDegree_sum_order_by | null;
  var_pop?: CourseDegree_var_pop_order_by | null;
  var_samp?: CourseDegree_var_samp_order_by | null;
  variance?: CourseDegree_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseDegree"
 */
export interface CourseDegree_arr_rel_insert_input {
  data: CourseDegree_insert_input[];
  on_conflict?: CourseDegree_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseDegree"
 */
export interface CourseDegree_avg_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseDegree". All fields are combined with a logical 'AND'.
 */
export interface CourseDegree_bool_exp {
  Course?: Course_bool_exp | null;
  DegreeCourse?: Course_bool_exp | null;
  _and?: CourseDegree_bool_exp[] | null;
  _not?: CourseDegree_bool_exp | null;
  _or?: CourseDegree_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  degreeCourseId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseDegree"
 */
export interface CourseDegree_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  DegreeCourse?: Course_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  degreeCourseId?: number | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "CourseDegree"
 */
export interface CourseDegree_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseDegree"
 */
export interface CourseDegree_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "CourseDegree"
 */
export interface CourseDegree_on_conflict {
  constraint: CourseDegree_constraint;
  update_columns: CourseDegree_update_column[];
  where?: CourseDegree_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CourseDegree"
 */
export interface CourseDegree_stddev_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseDegree"
 */
export interface CourseDegree_stddev_pop_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseDegree"
 */
export interface CourseDegree_stddev_samp_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseDegree"
 */
export interface CourseDegree_sum_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseDegree"
 */
export interface CourseDegree_var_pop_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseDegree"
 */
export interface CourseDegree_var_samp_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseDegree"
 */
export interface CourseDegree_variance_order_by {
  courseId?: order_by | null;
  degreeCourseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollmentStatus". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollmentStatus_bool_exp {
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_bool_exp | null;
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
 * Ordering options when selecting data from "CourseEnrollmentStatus".
 */
export interface CourseEnrollmentStatus_order_by {
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface CourseEnrollment_aggregate_bool_exp {
  count?: CourseEnrollment_aggregate_bool_exp_count | null;
}

export interface CourseEnrollment_aggregate_bool_exp_count {
  arguments?: CourseEnrollment_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseEnrollment_bool_exp | null;
  predicate: Int_comparison_exp;
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
  LocationOption?: LocationOption_bool_exp | null;
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
  location?: LocationOption_enum_comparison_exp | null;
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
  LocationOption?: LocationOption_obj_rel_insert_input | null;
  MotivationRating?: MotivationRating_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  achievementCertificateURL?: string | null;
  attendanceCertificateURL?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  invitationExpirationDate?: any | null;
  location?: LocationOption_enum | null;
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
 * Ordering options when selecting data from "CourseEnrollment".
 */
export interface CourseEnrollment_order_by {
  Course?: Course_order_by | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_order_by | null;
  LocationOption?: LocationOption_order_by | null;
  MotivationRating?: MotivationRating_order_by | null;
  User?: User_order_by | null;
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  location?: order_by | null;
  motivationLetter?: order_by | null;
  motivationRating?: order_by | null;
  status?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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

export interface CourseFundingOrganization_aggregate_bool_exp {
  count?: CourseFundingOrganization_aggregate_bool_exp_count | null;
}

export interface CourseFundingOrganization_aggregate_bool_exp_count {
  arguments?: CourseFundingOrganization_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseFundingOrganization_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_aggregate_order_by {
  avg?: CourseFundingOrganization_avg_order_by | null;
  count?: order_by | null;
  max?: CourseFundingOrganization_max_order_by | null;
  min?: CourseFundingOrganization_min_order_by | null;
  stddev?: CourseFundingOrganization_stddev_order_by | null;
  stddev_pop?: CourseFundingOrganization_stddev_pop_order_by | null;
  stddev_samp?: CourseFundingOrganization_stddev_samp_order_by | null;
  sum?: CourseFundingOrganization_sum_order_by | null;
  var_pop?: CourseFundingOrganization_var_pop_order_by | null;
  var_samp?: CourseFundingOrganization_var_samp_order_by | null;
  variance?: CourseFundingOrganization_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_arr_rel_insert_input {
  data: CourseFundingOrganization_insert_input[];
  on_conflict?: CourseFundingOrganization_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseFundingOrganization". All fields are combined with a logical 'AND'.
 */
export interface CourseFundingOrganization_bool_exp {
  Course?: Course_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  _and?: CourseFundingOrganization_bool_exp[] | null;
  _not?: CourseFundingOrganization_bool_exp | null;
  _or?: CourseFundingOrganization_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  organizationId?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_on_conflict {
  constraint: CourseFundingOrganization_constraint;
  update_columns: CourseFundingOrganization_update_column[];
  where?: CourseFundingOrganization_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseFundingOrganization"
 */
export interface CourseFundingOrganization_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseGroupOption". All fields are combined with a logical 'AND'.
 */
export interface CourseGroupOption_bool_exp {
  CourseGroups?: CourseGroup_bool_exp | null;
  CourseGroups_aggregate?: CourseGroup_aggregate_bool_exp | null;
  _and?: CourseGroupOption_bool_exp[] | null;
  _not?: CourseGroupOption_bool_exp | null;
  _or?: CourseGroupOption_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  order?: Int_comparison_exp | null;
  sliderGroup?: Boolean_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseGroupOption"
 */
export interface CourseGroupOption_insert_input {
  CourseGroups?: CourseGroup_arr_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  order?: number | null;
  sliderGroup?: boolean | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "CourseGroupOption"
 */
export interface CourseGroupOption_obj_rel_insert_input {
  data: CourseGroupOption_insert_input;
  on_conflict?: CourseGroupOption_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseGroupOption"
 */
export interface CourseGroupOption_on_conflict {
  constraint: CourseGroupOption_constraint;
  update_columns: CourseGroupOption_update_column[];
  where?: CourseGroupOption_bool_exp | null;
}

export interface CourseGroup_aggregate_bool_exp {
  count?: CourseGroup_aggregate_bool_exp_count | null;
}

export interface CourseGroup_aggregate_bool_exp_count {
  arguments?: CourseGroup_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseGroup_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CourseGroup"
 */
export interface CourseGroup_aggregate_order_by {
  avg?: CourseGroup_avg_order_by | null;
  count?: order_by | null;
  max?: CourseGroup_max_order_by | null;
  min?: CourseGroup_min_order_by | null;
  stddev?: CourseGroup_stddev_order_by | null;
  stddev_pop?: CourseGroup_stddev_pop_order_by | null;
  stddev_samp?: CourseGroup_stddev_samp_order_by | null;
  sum?: CourseGroup_sum_order_by | null;
  var_pop?: CourseGroup_var_pop_order_by | null;
  var_samp?: CourseGroup_var_samp_order_by | null;
  variance?: CourseGroup_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseGroup"
 */
export interface CourseGroup_arr_rel_insert_input {
  data: CourseGroup_insert_input[];
  on_conflict?: CourseGroup_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseGroup"
 */
export interface CourseGroup_avg_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseGroup". All fields are combined with a logical 'AND'.
 */
export interface CourseGroup_bool_exp {
  Course?: Course_bool_exp | null;
  CourseGroupOption?: CourseGroupOption_bool_exp | null;
  _and?: CourseGroup_bool_exp[] | null;
  _not?: CourseGroup_bool_exp | null;
  _or?: CourseGroup_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  groupOptionId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseGroup"
 */
export interface CourseGroup_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  CourseGroupOption?: CourseGroupOption_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  groupOptionId?: number | null;
  id?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "CourseGroup"
 */
export interface CourseGroup_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseGroup"
 */
export interface CourseGroup_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "CourseGroup"
 */
export interface CourseGroup_on_conflict {
  constraint: CourseGroup_constraint;
  update_columns: CourseGroup_update_column[];
  where?: CourseGroup_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CourseGroup"
 */
export interface CourseGroup_stddev_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseGroup"
 */
export interface CourseGroup_stddev_pop_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseGroup"
 */
export interface CourseGroup_stddev_samp_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseGroup"
 */
export interface CourseGroup_sum_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseGroup"
 */
export interface CourseGroup_var_pop_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseGroup"
 */
export interface CourseGroup_var_samp_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseGroup"
 */
export interface CourseGroup_variance_order_by {
  courseId?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
}

export interface CourseInstructor_aggregate_bool_exp {
  count?: CourseInstructor_aggregate_bool_exp_count | null;
}

export interface CourseInstructor_aggregate_bool_exp_count {
  arguments?: CourseInstructor_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseInstructor_bool_exp | null;
  predicate: Int_comparison_exp;
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
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseInstructor". All fields are combined with a logical 'AND'.
 */
export interface CourseInstructor_bool_exp {
  Course?: Course_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: CourseInstructor_bool_exp[] | null;
  _not?: CourseInstructor_bool_exp | null;
  _or?: CourseInstructor_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseInstructor"
 */
export interface CourseInstructor_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseInstructor"
 */
export interface CourseInstructor_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

export interface CourseLocation_aggregate_bool_exp {
  count?: CourseLocation_aggregate_bool_exp_count | null;
}

export interface CourseLocation_aggregate_bool_exp_count {
  arguments?: CourseLocation_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseLocation_bool_exp | null;
  predicate: Int_comparison_exp;
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
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseLocation". All fields are combined with a logical 'AND'.
 */
export interface CourseLocation_bool_exp {
  Course?: Course_bool_exp | null;
  DefaultSessionAddress?: LocationAddress_bool_exp | null;
  LocationOption?: LocationOption_bool_exp | null;
  _and?: CourseLocation_bool_exp[] | null;
  _not?: CourseLocation_bool_exp | null;
  _or?: CourseLocation_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  defaultSessionAddress?: String_comparison_exp | null;
  defaultSessionAddressId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  locationOption?: LocationOption_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseLocation"
 */
export interface CourseLocation_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  DefaultSessionAddress?: LocationAddress_obj_rel_insert_input | null;
  LocationOption?: LocationOption_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  defaultSessionAddress?: string | null;
  defaultSessionAddressId?: number | null;
  id?: number | null;
  locationOption?: LocationOption_enum | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "CourseLocation"
 */
export interface CourseLocation_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  defaultSessionAddress?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "CourseLocation"
 */
export interface CourseLocation_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  defaultSessionAddress?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "CourseLocation"
 */
export interface CourseLocation_obj_rel_insert_input {
  data: CourseLocation_insert_input;
  on_conflict?: CourseLocation_on_conflict | null;
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
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseLocation"
 */
export interface CourseLocation_stddev_pop_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseLocation"
 */
export interface CourseLocation_stddev_samp_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseLocation"
 */
export interface CourseLocation_sum_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseLocation"
 */
export interface CourseLocation_var_pop_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseLocation"
 */
export interface CourseLocation_var_samp_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseLocation"
 */
export interface CourseLocation_variance_order_by {
  courseId?: order_by | null;
  defaultSessionAddressId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseRegistrationType". All fields are combined with a logical 'AND'.
 */
export interface CourseRegistrationType_bool_exp {
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
  _and?: CourseRegistrationType_bool_exp[] | null;
  _not?: CourseRegistrationType_bool_exp | null;
  _or?: CourseRegistrationType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "CourseRegistrationType_enum". All fields are combined with logical 'AND'.
 */
export interface CourseRegistrationType_enum_comparison_exp {
  _eq?: CourseRegistrationType_enum | null;
  _in?: CourseRegistrationType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: CourseRegistrationType_enum | null;
  _nin?: CourseRegistrationType_enum[] | null;
}

/**
 * input type for inserting data into table "CourseRegistrationType"
 */
export interface CourseRegistrationType_insert_input {
  Courses?: Course_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "CourseRegistrationType"
 */
export interface CourseRegistrationType_obj_rel_insert_input {
  data: CourseRegistrationType_insert_input;
  on_conflict?: CourseRegistrationType_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseRegistrationType"
 */
export interface CourseRegistrationType_on_conflict {
  constraint: CourseRegistrationType_constraint;
  update_columns: CourseRegistrationType_update_column[];
  where?: CourseRegistrationType_bool_exp | null;
}

/**
 * Ordering options when selecting data from "CourseRegistrationType".
 */
export interface CourseRegistrationType_order_by {
  Courses_aggregate?: Course_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseStatus". All fields are combined with a logical 'AND'.
 */
export interface CourseStatus_bool_exp {
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
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

export interface Course_aggregate_bool_exp {
  bool_and?: Course_aggregate_bool_exp_bool_and | null;
  bool_or?: Course_aggregate_bool_exp_bool_or | null;
  count?: Course_aggregate_bool_exp_count | null;
}

export interface Course_aggregate_bool_exp_bool_and {
  arguments: Course_select_column_Course_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: Course_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Course_aggregate_bool_exp_bool_or {
  arguments: Course_select_column_Course_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: Course_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Course_aggregate_bool_exp_count {
  arguments?: Course_select_column[] | null;
  distinct?: boolean | null;
  filter?: Course_bool_exp | null;
  predicate: Int_comparison_exp;
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
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_bool_exp | null;
  CourseDegrees?: CourseDegree_bool_exp | null;
  CourseDegrees_aggregate?: CourseDegree_aggregate_bool_exp | null;
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_bool_exp | null;
  CourseFundingOrganizations?: CourseFundingOrganization_bool_exp | null;
  CourseFundingOrganizations_aggregate?: CourseFundingOrganization_aggregate_bool_exp | null;
  CourseGroups?: CourseGroup_bool_exp | null;
  CourseGroups_aggregate?: CourseGroup_aggregate_bool_exp | null;
  CourseInstructors?: CourseInstructor_bool_exp | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_bool_exp | null;
  CourseLocations?: CourseLocation_bool_exp | null;
  CourseLocations_aggregate?: CourseLocation_aggregate_bool_exp | null;
  CourseRegistrationType?: CourseRegistrationType_bool_exp | null;
  CourseStatus?: CourseStatus_bool_exp | null;
  DegreeCourses?: CourseDegree_bool_exp | null;
  DegreeCourses_aggregate?: CourseDegree_aggregate_bool_exp | null;
  Language?: Language_bool_exp | null;
  Program?: Program_bool_exp | null;
  Sessions?: Session_bool_exp | null;
  Sessions_aggregate?: Session_aggregate_bool_exp | null;
  Weekday?: Weekday_bool_exp | null;
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
  endTime?: time_comparison_exp | null;
  externalRegistrationLink?: String_comparison_exp | null;
  formbricksEnrollmentSurveyUrl?: String_comparison_exp | null;
  headingDescriptionField1?: String_comparison_exp | null;
  headingDescriptionField2?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  language?: String_comparison_exp | null;
  learningGoals?: String_comparison_exp | null;
  maxMissedSessions?: Int_comparison_exp | null;
  maxParticipants?: Int_comparison_exp | null;
  programId?: Int_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  registrationType?: CourseRegistrationType_enum_comparison_exp | null;
  startTime?: time_comparison_exp | null;
  status?: CourseStatus_enum_comparison_exp | null;
  tagline?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  weekDay?: Weekday_enum_comparison_exp | null;
}

/**
 * input type for inserting data into table "Course"
 */
export interface Course_insert_input {
  AchievementOptionCourses?: AchievementOptionCourse_arr_rel_insert_input | null;
  CourseDegrees?: CourseDegree_arr_rel_insert_input | null;
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  CourseFundingOrganizations?: CourseFundingOrganization_arr_rel_insert_input | null;
  CourseGroups?: CourseGroup_arr_rel_insert_input | null;
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  CourseLocations?: CourseLocation_arr_rel_insert_input | null;
  CourseRegistrationType?: CourseRegistrationType_obj_rel_insert_input | null;
  CourseStatus?: CourseStatus_obj_rel_insert_input | null;
  DegreeCourses?: CourseDegree_arr_rel_insert_input | null;
  Language?: Language_obj_rel_insert_input | null;
  Program?: Program_obj_rel_insert_input | null;
  Sessions?: Session_arr_rel_insert_input | null;
  Weekday?: Weekday_obj_rel_insert_input | null;
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
  externalRegistrationLink?: string | null;
  formbricksEnrollmentSurveyUrl?: string | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  maxMissedSessions?: number | null;
  maxParticipants?: number | null;
  programId?: number | null;
  published?: boolean | null;
  registrationType?: CourseRegistrationType_enum | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  tagline?: string | null;
  title?: string | null;
  updated_at?: any | null;
  weekDay?: Weekday_enum | null;
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
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
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
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
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
  CourseDegrees_aggregate?: CourseDegree_aggregate_order_by | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  CourseFundingOrganizations_aggregate?: CourseFundingOrganization_aggregate_order_by | null;
  CourseGroups_aggregate?: CourseGroup_aggregate_order_by | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_order_by | null;
  CourseLocations_aggregate?: CourseLocation_aggregate_order_by | null;
  CourseRegistrationType?: CourseRegistrationType_order_by | null;
  CourseStatus?: CourseStatus_order_by | null;
  DegreeCourses_aggregate?: CourseDegree_aggregate_order_by | null;
  Language?: Language_order_by | null;
  Program?: Program_order_by | null;
  Sessions_aggregate?: Session_aggregate_order_by | null;
  Weekday?: Weekday_order_by | null;
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
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  published?: order_by | null;
  registrationType?: order_by | null;
  startTime?: order_by | null;
  status?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
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
  externalRegistrationLink?: string | null;
  formbricksEnrollmentSurveyUrl?: string | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  maxMissedSessions?: number | null;
  maxParticipants?: number | null;
  programId?: number | null;
  published?: boolean | null;
  registrationType?: CourseRegistrationType_enum | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  tagline?: string | null;
  title?: string | null;
  updated_at?: any | null;
  weekDay?: Weekday_enum | null;
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
 * Boolean expression to filter rows from the table "Language". All fields are combined with a logical 'AND'.
 */
export interface Language_bool_exp {
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
  _and?: Language_bool_exp[] | null;
  _not?: Language_bool_exp | null;
  _or?: Language_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Language"
 */
export interface Language_insert_input {
  Courses?: Course_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "Language"
 */
export interface Language_obj_rel_insert_input {
  data: Language_insert_input;
  on_conflict?: Language_on_conflict | null;
}

/**
 * on_conflict condition type for table "Language"
 */
export interface Language_on_conflict {
  constraint: Language_constraint;
  update_columns: Language_update_column[];
  where?: Language_bool_exp | null;
}

/**
 * Ordering options when selecting data from "Language".
 */
export interface Language_order_by {
  Courses_aggregate?: Course_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface LocationAddress_aggregate_bool_exp {
  count?: LocationAddress_aggregate_bool_exp_count | null;
}

export interface LocationAddress_aggregate_bool_exp_count {
  arguments?: LocationAddress_select_column[] | null;
  distinct?: boolean | null;
  filter?: LocationAddress_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "LocationAddress"
 */
export interface LocationAddress_aggregate_order_by {
  avg?: LocationAddress_avg_order_by | null;
  count?: order_by | null;
  max?: LocationAddress_max_order_by | null;
  min?: LocationAddress_min_order_by | null;
  stddev?: LocationAddress_stddev_order_by | null;
  stddev_pop?: LocationAddress_stddev_pop_order_by | null;
  stddev_samp?: LocationAddress_stddev_samp_order_by | null;
  sum?: LocationAddress_sum_order_by | null;
  var_pop?: LocationAddress_var_pop_order_by | null;
  var_samp?: LocationAddress_var_samp_order_by | null;
  variance?: LocationAddress_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "LocationAddress"
 */
export interface LocationAddress_arr_rel_insert_input {
  data: LocationAddress_insert_input[];
  on_conflict?: LocationAddress_on_conflict | null;
}

/**
 * order by avg() on columns of table "LocationAddress"
 */
export interface LocationAddress_avg_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "LocationAddress". All fields are combined with a logical 'AND'.
 */
export interface LocationAddress_bool_exp {
  CourseLocations?: CourseLocation_bool_exp | null;
  CourseLocations_aggregate?: CourseLocation_aggregate_bool_exp | null;
  LocationOption?: LocationOption_bool_exp | null;
  SessionAddresses?: SessionAddress_bool_exp | null;
  SessionAddresses_aggregate?: SessionAddress_aggregate_bool_exp | null;
  _and?: LocationAddress_bool_exp[] | null;
  _not?: LocationAddress_bool_exp | null;
  _or?: LocationAddress_bool_exp[] | null;
  address?: String_comparison_exp | null;
  aliases?: jsonb_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  locationOption?: LocationOption_enum_comparison_exp | null;
  shortLabel?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "LocationAddress"
 */
export interface LocationAddress_insert_input {
  CourseLocations?: CourseLocation_arr_rel_insert_input | null;
  LocationOption?: LocationOption_obj_rel_insert_input | null;
  SessionAddresses?: SessionAddress_arr_rel_insert_input | null;
  address?: string | null;
  aliases?: any | null;
  created_at?: any | null;
  description?: string | null;
  id?: number | null;
  locationOption?: LocationOption_enum | null;
  shortLabel?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "LocationAddress"
 */
export interface LocationAddress_max_order_by {
  address?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  shortLabel?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "LocationAddress"
 */
export interface LocationAddress_min_order_by {
  address?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  shortLabel?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "LocationAddress"
 */
export interface LocationAddress_obj_rel_insert_input {
  data: LocationAddress_insert_input;
  on_conflict?: LocationAddress_on_conflict | null;
}

/**
 * on_conflict condition type for table "LocationAddress"
 */
export interface LocationAddress_on_conflict {
  constraint: LocationAddress_constraint;
  update_columns: LocationAddress_update_column[];
  where?: LocationAddress_bool_exp | null;
}

/**
 * Ordering options when selecting data from "LocationAddress".
 */
export interface LocationAddress_order_by {
  CourseLocations_aggregate?: CourseLocation_aggregate_order_by | null;
  LocationOption?: LocationOption_order_by | null;
  SessionAddresses_aggregate?: SessionAddress_aggregate_order_by | null;
  address?: order_by | null;
  aliases?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  locationOption?: order_by | null;
  shortLabel?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by stddev() on columns of table "LocationAddress"
 */
export interface LocationAddress_stddev_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "LocationAddress"
 */
export interface LocationAddress_stddev_pop_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "LocationAddress"
 */
export interface LocationAddress_stddev_samp_order_by {
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "LocationAddress"
 */
export interface LocationAddress_sum_order_by {
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "LocationAddress"
 */
export interface LocationAddress_var_pop_order_by {
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "LocationAddress"
 */
export interface LocationAddress_var_samp_order_by {
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "LocationAddress"
 */
export interface LocationAddress_variance_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "LocationOption". All fields are combined with a logical 'AND'.
 */
export interface LocationOption_bool_exp {
  LocationAddresses?: LocationAddress_bool_exp | null;
  LocationAddresses_aggregate?: LocationAddress_aggregate_bool_exp | null;
  Locations?: CourseLocation_bool_exp | null;
  Locations_aggregate?: CourseLocation_aggregate_bool_exp | null;
  _and?: LocationOption_bool_exp[] | null;
  _not?: LocationOption_bool_exp | null;
  _or?: LocationOption_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "LocationOption_enum". All fields are combined with logical 'AND'.
 */
export interface LocationOption_enum_comparison_exp {
  _eq?: LocationOption_enum | null;
  _in?: LocationOption_enum[] | null;
  _is_null?: boolean | null;
  _neq?: LocationOption_enum | null;
  _nin?: LocationOption_enum[] | null;
}

/**
 * input type for inserting data into table "LocationOption"
 */
export interface LocationOption_insert_input {
  LocationAddresses?: LocationAddress_arr_rel_insert_input | null;
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
 * Ordering options when selecting data from "LocationOption".
 */
export interface LocationOption_order_by {
  LocationAddresses_aggregate?: LocationAddress_aggregate_order_by | null;
  Locations_aggregate?: CourseLocation_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "MailTemplate". All fields are combined with a logical 'AND'.
 */
export interface MailTemplate_bool_exp {
  Course?: Course_bool_exp | null;
  _and?: MailTemplate_bool_exp[] | null;
  _not?: MailTemplate_bool_exp | null;
  _or?: MailTemplate_bool_exp[] | null;
  bcc?: String_comparison_exp | null;
  cc?: String_comparison_exp | null;
  content?: String_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  from?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  subject?: String_comparison_exp | null;
  type?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "MailTemplate"
 */
export interface MailTemplate_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  bcc?: string | null;
  cc?: string | null;
  content?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  from?: string | null;
  id?: number | null;
  subject?: string | null;
  type?: string | null;
  updated_at?: any | null;
}

/**
 * Ordering options when selecting data from "MailTemplate".
 */
export interface MailTemplate_order_by {
  Course?: Course_order_by | null;
  bcc?: order_by | null;
  cc?: order_by | null;
  content?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  from?: order_by | null;
  id?: order_by | null;
  subject?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "MotivationRating". All fields are combined with a logical 'AND'.
 */
export interface MotivationRating_bool_exp {
  Enrollments?: CourseEnrollment_bool_exp | null;
  Enrollments_aggregate?: CourseEnrollment_aggregate_bool_exp | null;
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
 * Ordering options when selecting data from "MotivationRating".
 */
export interface MotivationRating_order_by {
  Enrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface OrganizationAdmin_aggregate_bool_exp {
  bool_and?: OrganizationAdmin_aggregate_bool_exp_bool_and | null;
  bool_or?: OrganizationAdmin_aggregate_bool_exp_bool_or | null;
  count?: OrganizationAdmin_aggregate_bool_exp_count | null;
}

export interface OrganizationAdmin_aggregate_bool_exp_bool_and {
  arguments: OrganizationAdmin_select_column_OrganizationAdmin_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: OrganizationAdmin_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface OrganizationAdmin_aggregate_bool_exp_bool_or {
  arguments: OrganizationAdmin_select_column_OrganizationAdmin_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: OrganizationAdmin_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface OrganizationAdmin_aggregate_bool_exp_count {
  arguments?: OrganizationAdmin_select_column[] | null;
  distinct?: boolean | null;
  filter?: OrganizationAdmin_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_aggregate_order_by {
  avg?: OrganizationAdmin_avg_order_by | null;
  count?: order_by | null;
  max?: OrganizationAdmin_max_order_by | null;
  min?: OrganizationAdmin_min_order_by | null;
  stddev?: OrganizationAdmin_stddev_order_by | null;
  stddev_pop?: OrganizationAdmin_stddev_pop_order_by | null;
  stddev_samp?: OrganizationAdmin_stddev_samp_order_by | null;
  sum?: OrganizationAdmin_sum_order_by | null;
  var_pop?: OrganizationAdmin_var_pop_order_by | null;
  var_samp?: OrganizationAdmin_var_samp_order_by | null;
  variance?: OrganizationAdmin_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "OrganizationAdmin"
 */
export interface OrganizationAdmin_arr_rel_insert_input {
  data: OrganizationAdmin_insert_input[];
  on_conflict?: OrganizationAdmin_on_conflict | null;
}

/**
 * order by avg() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_avg_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "OrganizationAdmin". All fields are combined with a logical 'AND'.
 */
export interface OrganizationAdmin_bool_exp {
  Organization?: Organization_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: OrganizationAdmin_bool_exp[] | null;
  _not?: OrganizationAdmin_bool_exp | null;
  _or?: OrganizationAdmin_bool_exp[] | null;
  canManageCourses?: Boolean_comparison_exp | null;
  canManageEvents?: Boolean_comparison_exp | null;
  canManageSettings?: Boolean_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "OrganizationAdmin"
 */
export interface OrganizationAdmin_insert_input {
  Organization?: Organization_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  canManageCourses?: boolean | null;
  canManageEvents?: boolean | null;
  canManageSettings?: boolean | null;
  created_at?: any | null;
  id?: number | null;
  organizationId?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * on_conflict condition type for table "OrganizationAdmin"
 */
export interface OrganizationAdmin_on_conflict {
  constraint: OrganizationAdmin_constraint;
  update_columns: OrganizationAdmin_update_column[];
  where?: OrganizationAdmin_bool_exp | null;
}

/**
 * Ordering options when selecting data from "OrganizationAdmin".
 */
export interface OrganizationAdmin_order_by {
  Organization?: Organization_order_by | null;
  User?: User_order_by | null;
  canManageCourses?: order_by | null;
  canManageEvents?: order_by | null;
  canManageSettings?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by stddev() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_stddev_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_stddev_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_stddev_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_sum_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_var_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_var_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "OrganizationAdmin"
 */
export interface OrganizationAdmin_variance_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "OrganizationType". All fields are combined with a logical 'AND'.
 */
export interface OrganizationType_bool_exp {
  Organizations?: Organization_bool_exp | null;
  Organizations_aggregate?: Organization_aggregate_bool_exp | null;
  _and?: OrganizationType_bool_exp[] | null;
  _not?: OrganizationType_bool_exp | null;
  _or?: OrganizationType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "OrganizationType_enum". All fields are combined with logical 'AND'.
 */
export interface OrganizationType_enum_comparison_exp {
  _eq?: OrganizationType_enum | null;
  _in?: OrganizationType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: OrganizationType_enum | null;
  _nin?: OrganizationType_enum[] | null;
}

/**
 * input type for inserting data into table "OrganizationType"
 */
export interface OrganizationType_insert_input {
  Organizations?: Organization_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "OrganizationType"
 */
export interface OrganizationType_obj_rel_insert_input {
  data: OrganizationType_insert_input;
  on_conflict?: OrganizationType_on_conflict | null;
}

/**
 * on_conflict condition type for table "OrganizationType"
 */
export interface OrganizationType_on_conflict {
  constraint: OrganizationType_constraint;
  update_columns: OrganizationType_update_column[];
  where?: OrganizationType_bool_exp | null;
}

/**
 * Ordering options when selecting data from "OrganizationType".
 */
export interface OrganizationType_order_by {
  Organizations_aggregate?: Organization_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface Organization_aggregate_bool_exp {
  count?: Organization_aggregate_bool_exp_count | null;
}

export interface Organization_aggregate_bool_exp_count {
  arguments?: Organization_select_column[] | null;
  distinct?: boolean | null;
  filter?: Organization_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "Organization"
 */
export interface Organization_aggregate_order_by {
  avg?: Organization_avg_order_by | null;
  count?: order_by | null;
  max?: Organization_max_order_by | null;
  min?: Organization_min_order_by | null;
  stddev?: Organization_stddev_order_by | null;
  stddev_pop?: Organization_stddev_pop_order_by | null;
  stddev_samp?: Organization_stddev_samp_order_by | null;
  sum?: Organization_sum_order_by | null;
  var_pop?: Organization_var_pop_order_by | null;
  var_samp?: Organization_var_samp_order_by | null;
  variance?: Organization_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Organization"
 */
export interface Organization_arr_rel_insert_input {
  data: Organization_insert_input[];
  on_conflict?: Organization_on_conflict | null;
}

/**
 * order by avg() on columns of table "Organization"
 */
export interface Organization_avg_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Organization". All fields are combined with a logical 'AND'.
 */
export interface Organization_bool_exp {
  FundedCourses?: CourseFundingOrganization_bool_exp | null;
  FundedCourses_aggregate?: CourseFundingOrganization_aggregate_bool_exp | null;
  OrganizationAdmins?: OrganizationAdmin_bool_exp | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_bool_exp | null;
  OrganizationType?: OrganizationType_bool_exp | null;
  Users?: User_bool_exp | null;
  Users_aggregate?: User_aggregate_bool_exp | null;
  _and?: Organization_bool_exp[] | null;
  _not?: Organization_bool_exp | null;
  _or?: Organization_bool_exp[] | null;
  aliases?: jsonb_comparison_exp | null;
  apiKeyHash?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  logo?: String_comparison_exp | null;
  name?: String_comparison_exp | null;
  type?: OrganizationType_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Organization"
 */
export interface Organization_insert_input {
  FundedCourses?: CourseFundingOrganization_arr_rel_insert_input | null;
  OrganizationAdmins?: OrganizationAdmin_arr_rel_insert_input | null;
  OrganizationType?: OrganizationType_obj_rel_insert_input | null;
  Users?: User_arr_rel_insert_input | null;
  aliases?: any | null;
  apiKeyHash?: string | null;
  created_at?: any | null;
  description?: string | null;
  id?: number | null;
  logo?: string | null;
  name?: string | null;
  type?: OrganizationType_enum | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "Organization"
 */
export interface Organization_max_order_by {
  apiKeyHash?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  logo?: order_by | null;
  name?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "Organization"
 */
export interface Organization_min_order_by {
  apiKeyHash?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  logo?: order_by | null;
  name?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "Organization"
 */
export interface Organization_obj_rel_insert_input {
  data: Organization_insert_input;
  on_conflict?: Organization_on_conflict | null;
}

/**
 * on_conflict condition type for table "Organization"
 */
export interface Organization_on_conflict {
  constraint: Organization_constraint;
  update_columns: Organization_update_column[];
  where?: Organization_bool_exp | null;
}

/**
 * Ordering options when selecting data from "Organization".
 */
export interface Organization_order_by {
  FundedCourses_aggregate?: CourseFundingOrganization_aggregate_order_by | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_order_by | null;
  OrganizationType?: OrganizationType_order_by | null;
  Users_aggregate?: User_aggregate_order_by | null;
  aliases?: order_by | null;
  apiKeyHash?: order_by | null;
  created_at?: order_by | null;
  description?: order_by | null;
  id?: order_by | null;
  logo?: order_by | null;
  name?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by stddev() on columns of table "Organization"
 */
export interface Organization_stddev_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Organization"
 */
export interface Organization_stddev_pop_order_by {
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Organization"
 */
export interface Organization_stddev_samp_order_by {
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Organization"
 */
export interface Organization_sum_order_by {
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Organization"
 */
export interface Organization_var_pop_order_by {
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Organization"
 */
export interface Organization_var_samp_order_by {
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Organization"
 */
export interface Organization_variance_order_by {
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProgramType". All fields are combined with a logical 'AND'.
 */
export interface ProgramType_bool_exp {
  Programs?: Program_bool_exp | null;
  Programs_aggregate?: Program_aggregate_bool_exp | null;
  _and?: ProgramType_bool_exp[] | null;
  _not?: ProgramType_bool_exp | null;
  _or?: ProgramType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "ProgramType_enum". All fields are combined with logical 'AND'.
 */
export interface ProgramType_enum_comparison_exp {
  _eq?: ProgramType_enum | null;
  _in?: ProgramType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: ProgramType_enum | null;
  _nin?: ProgramType_enum[] | null;
}

/**
 * input type for inserting data into table "ProgramType"
 */
export interface ProgramType_insert_input {
  Programs?: Program_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "ProgramType"
 */
export interface ProgramType_obj_rel_insert_input {
  data: ProgramType_insert_input;
  on_conflict?: ProgramType_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProgramType"
 */
export interface ProgramType_on_conflict {
  constraint: ProgramType_constraint;
  update_columns: ProgramType_update_column[];
  where?: ProgramType_bool_exp | null;
}

/**
 * Ordering options when selecting data from "ProgramType".
 */
export interface ProgramType_order_by {
  Programs_aggregate?: Program_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface Program_aggregate_bool_exp {
  bool_and?: Program_aggregate_bool_exp_bool_and | null;
  bool_or?: Program_aggregate_bool_exp_bool_or | null;
  count?: Program_aggregate_bool_exp_count | null;
}

export interface Program_aggregate_bool_exp_bool_and {
  arguments: Program_select_column_Program_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: Program_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Program_aggregate_bool_exp_bool_or {
  arguments: Program_select_column_Program_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: Program_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Program_aggregate_bool_exp_count {
  arguments?: Program_select_column[] | null;
  distinct?: boolean | null;
  filter?: Program_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "Program"
 */
export interface Program_aggregate_order_by {
  avg?: Program_avg_order_by | null;
  count?: order_by | null;
  max?: Program_max_order_by | null;
  min?: Program_min_order_by | null;
  stddev?: Program_stddev_order_by | null;
  stddev_pop?: Program_stddev_pop_order_by | null;
  stddev_samp?: Program_stddev_samp_order_by | null;
  sum?: Program_sum_order_by | null;
  var_pop?: Program_var_pop_order_by | null;
  var_samp?: Program_var_samp_order_by | null;
  variance?: Program_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Program"
 */
export interface Program_arr_rel_insert_input {
  data: Program_insert_input[];
  on_conflict?: Program_on_conflict | null;
}

/**
 * order by avg() on columns of table "Program"
 */
export interface Program_avg_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Program". All fields are combined with a logical 'AND'.
 */
export interface Program_bool_exp {
  CertificateTemplatePrograms?: CertificateTemplateProgram_bool_exp | null;
  CertificateTemplatePrograms_aggregate?: CertificateTemplateProgram_aggregate_bool_exp | null;
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
  ProgramType?: ProgramType_bool_exp | null;
  RentAScientistConfigs?: RentAScientistConfig_bool_exp | null;
  RentAScientistConfigs_aggregate?: RentAScientistConfig_aggregate_bool_exp | null;
  ScientistOffers?: ScientistOffer_bool_exp | null;
  ScientistOffers_aggregate?: ScientistOffer_aggregate_bool_exp | null;
  _and?: Program_bool_exp[] | null;
  _not?: Program_bool_exp | null;
  _or?: Program_bool_exp[] | null;
  achievementCertificateTemplateTextId?: Int_comparison_exp | null;
  achievementCertificateTemplateURL?: String_comparison_exp | null;
  achievementRecordUploadDeadline?: date_comparison_exp | null;
  applicationStart?: date_comparison_exp | null;
  attendanceCertificateTemplateTextId?: Int_comparison_exp | null;
  attendanceCertificateTemplateURL?: String_comparison_exp | null;
  closingQuestionnaire?: String_comparison_exp | null;
  defaultApplicationEnd?: date_comparison_exp | null;
  defaultFormbricksEnrollmentSurveyUrl?: String_comparison_exp | null;
  defaultMaxMissedSessions?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  lectureEnd?: date_comparison_exp | null;
  lectureStart?: date_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  shortTitle?: String_comparison_exp | null;
  speakerQuestionnaire?: String_comparison_exp | null;
  startQuestionnaire?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: ProgramType_enum_comparison_exp | null;
  visibility?: Boolean_comparison_exp | null;
  visibilityAchievementCertificate?: Boolean_comparison_exp | null;
  visibilityAttendanceCertificate?: Boolean_comparison_exp | null;
}

/**
 * input type for inserting data into table "Program"
 */
export interface Program_insert_input {
  CertificateTemplatePrograms?: CertificateTemplateProgram_arr_rel_insert_input | null;
  Courses?: Course_arr_rel_insert_input | null;
  ProgramType?: ProgramType_obj_rel_insert_input | null;
  RentAScientistConfigs?: RentAScientistConfig_arr_rel_insert_input | null;
  ScientistOffers?: ScientistOffer_arr_rel_insert_input | null;
  achievementCertificateTemplateTextId?: number | null;
  achievementCertificateTemplateURL?: string | null;
  achievementRecordUploadDeadline?: any | null;
  applicationStart?: any | null;
  attendanceCertificateTemplateTextId?: number | null;
  attendanceCertificateTemplateURL?: string | null;
  closingQuestionnaire?: string | null;
  defaultApplicationEnd?: any | null;
  defaultFormbricksEnrollmentSurveyUrl?: string | null;
  defaultMaxMissedSessions?: number | null;
  id?: number | null;
  lectureEnd?: any | null;
  lectureStart?: any | null;
  published?: boolean | null;
  shortTitle?: string | null;
  speakerQuestionnaire?: string | null;
  startQuestionnaire?: string | null;
  title?: string | null;
  type?: ProgramType_enum | null;
  visibility?: boolean | null;
  visibilityAchievementCertificate?: boolean | null;
  visibilityAttendanceCertificate?: boolean | null;
}

/**
 * order by max() on columns of table "Program"
 */
export interface Program_max_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
}

/**
 * order by min() on columns of table "Program"
 */
export interface Program_min_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
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
  CertificateTemplatePrograms_aggregate?: CertificateTemplateProgram_aggregate_order_by | null;
  Courses_aggregate?: Course_aggregate_order_by | null;
  ProgramType?: ProgramType_order_by | null;
  RentAScientistConfigs_aggregate?: RentAScientistConfig_aggregate_order_by | null;
  ScientistOffers_aggregate?: ScientistOffer_aggregate_order_by | null;
  achievementCertificateTemplateTextId?: order_by | null;
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  published?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
  visibility?: order_by | null;
  visibilityAchievementCertificate?: order_by | null;
  visibilityAttendanceCertificate?: order_by | null;
}

/**
 * order by stddev() on columns of table "Program"
 */
export interface Program_stddev_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Program"
 */
export interface Program_stddev_pop_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Program"
 */
export interface Program_stddev_samp_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Program"
 */
export interface Program_sum_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Program"
 */
export interface Program_var_pop_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Program"
 */
export interface Program_var_samp_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Program"
 */
export interface Program_variance_order_by {
  achievementCertificateTemplateTextId?: order_by | null;
  attendanceCertificateTemplateTextId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
}

export interface RentAScientistConfig_aggregate_bool_exp {
  bool_and?: RentAScientistConfig_aggregate_bool_exp_bool_and | null;
  bool_or?: RentAScientistConfig_aggregate_bool_exp_bool_or | null;
  count?: RentAScientistConfig_aggregate_bool_exp_count | null;
}

export interface RentAScientistConfig_aggregate_bool_exp_bool_and {
  arguments: RentAScientistConfig_select_column_RentAScientistConfig_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: RentAScientistConfig_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface RentAScientistConfig_aggregate_bool_exp_bool_or {
  arguments: RentAScientistConfig_select_column_RentAScientistConfig_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: RentAScientistConfig_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface RentAScientistConfig_aggregate_bool_exp_count {
  arguments?: RentAScientistConfig_select_column[] | null;
  distinct?: boolean | null;
  filter?: RentAScientistConfig_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "rentAScientist.RentAScientistConfig"
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
 * input type for inserting array relation for remote table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_arr_rel_insert_input {
  data: RentAScientistConfig_insert_input[];
  on_conflict?: RentAScientistConfig_on_conflict | null;
}

/**
 * order by avg() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_avg_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.RentAScientistConfig". All fields are combined with a logical 'AND'.
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
 * input type for inserting data into table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_insert_input {
  Program?: Program_obj_rel_insert_input | null;
  id?: number | null;
  mailFrom?: string | null;
  program_id?: number | null;
  test_operation?: boolean | null;
}

/**
 * order by max() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_max_order_by {
  id?: order_by | null;
  mailFrom?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by min() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_min_order_by {
  id?: order_by | null;
  mailFrom?: order_by | null;
  program_id?: order_by | null;
}

/**
 * on_conflict condition type for table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_on_conflict {
  constraint: RentAScientistConfig_constraint;
  update_columns: RentAScientistConfig_update_column[];
  where?: RentAScientistConfig_bool_exp | null;
}

/**
 * order by stddev() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_pop_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_stddev_samp_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by sum() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_sum_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_var_pop_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_var_samp_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

/**
 * order by variance() on columns of table "rentAScientist.RentAScientistConfig"
 */
export interface RentAScientistConfig_variance_order_by {
  id?: order_by | null;
  program_id?: order_by | null;
}

export interface SchoolClassRequest_aggregate_bool_exp {
  count?: SchoolClassRequest_aggregate_bool_exp_count | null;
}

export interface SchoolClassRequest_aggregate_bool_exp_count {
  arguments?: SchoolClassRequest_select_column[] | null;
  distinct?: boolean | null;
  filter?: SchoolClassRequest_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "rentAScientist.SchoolClassRequest"
 */
export interface SchoolClassRequest_arr_rel_insert_input {
  data: SchoolClassRequest_insert_input[];
  on_conflict?: SchoolClassRequest_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.SchoolClassRequest". All fields are combined with a logical 'AND'.
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
 * input type for inserting data into table "rentAScientist.SchoolClassRequest"
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
 * on_conflict condition type for table "rentAScientist.SchoolClassRequest"
 */
export interface SchoolClassRequest_on_conflict {
  constraint: SchoolClassRequest_constraint;
  update_columns: SchoolClassRequest_update_column[];
  where?: SchoolClassRequest_bool_exp | null;
}

export interface SchoolClass_aggregate_bool_exp {
  count?: SchoolClass_aggregate_bool_exp_count | null;
}

export interface SchoolClass_aggregate_bool_exp_count {
  arguments?: SchoolClass_select_column[] | null;
  distinct?: boolean | null;
  filter?: SchoolClass_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "rentAScientist.SchoolClass"
 */
export interface SchoolClass_arr_rel_insert_input {
  data: SchoolClass_insert_input[];
  on_conflict?: SchoolClass_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.SchoolClass". All fields are combined with a logical 'AND'.
 */
export interface SchoolClass_bool_exp {
  School?: School_bool_exp | null;
  SchoolClassRequests?: SchoolClassRequest_bool_exp | null;
  SchoolClassRequests_aggregate?: SchoolClassRequest_aggregate_bool_exp | null;
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
 * input type for inserting data into table "rentAScientist.SchoolClass"
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
 * input type for inserting object relation for remote table "rentAScientist.SchoolClass"
 */
export interface SchoolClass_obj_rel_insert_input {
  data: SchoolClass_insert_input;
  on_conflict?: SchoolClass_on_conflict | null;
}

/**
 * on_conflict condition type for table "rentAScientist.SchoolClass"
 */
export interface SchoolClass_on_conflict {
  constraint: SchoolClass_constraint;
  update_columns: SchoolClass_update_column[];
  where?: SchoolClass_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.School". All fields are combined with a logical 'AND'.
 */
export interface School_bool_exp {
  SchoolClasses?: SchoolClass_bool_exp | null;
  SchoolClasses_aggregate?: SchoolClass_aggregate_bool_exp | null;
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
 * input type for inserting data into table "rentAScientist.School"
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
 * input type for inserting object relation for remote table "rentAScientist.School"
 */
export interface School_obj_rel_insert_input {
  data: School_insert_input;
  on_conflict?: School_on_conflict | null;
}

/**
 * on_conflict condition type for table "rentAScientist.School"
 */
export interface School_on_conflict {
  constraint: School_constraint;
  update_columns: School_update_column[];
  where?: School_bool_exp | null;
}

export interface ScientistOfferRelation_aggregate_bool_exp {
  count?: ScientistOfferRelation_aggregate_bool_exp_count | null;
}

export interface ScientistOfferRelation_aggregate_bool_exp_count {
  arguments?: ScientistOfferRelation_select_column[] | null;
  distinct?: boolean | null;
  filter?: ScientistOfferRelation_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "rentAScientist.ScientistOfferRelation"
 */
export interface ScientistOfferRelation_arr_rel_insert_input {
  data: ScientistOfferRelation_insert_input[];
  on_conflict?: ScientistOfferRelation_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.ScientistOfferRelation". All fields are combined with a logical 'AND'.
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
 * input type for inserting data into table "rentAScientist.ScientistOfferRelation"
 */
export interface ScientistOfferRelation_insert_input {
  Scientist?: Scientist_obj_rel_insert_input | null;
  ScientistOffer?: ScientistOffer_obj_rel_insert_input | null;
  offerId?: number | null;
  scientistId?: number | null;
}

/**
 * on_conflict condition type for table "rentAScientist.ScientistOfferRelation"
 */
export interface ScientistOfferRelation_on_conflict {
  constraint: ScientistOfferRelation_constraint;
  update_columns: ScientistOfferRelation_update_column[];
  where?: ScientistOfferRelation_bool_exp | null;
}

export interface ScientistOffer_aggregate_bool_exp {
  count?: ScientistOffer_aggregate_bool_exp_count | null;
}

export interface ScientistOffer_aggregate_bool_exp_count {
  arguments?: ScientistOffer_select_column[] | null;
  distinct?: boolean | null;
  filter?: ScientistOffer_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "rentAScientist.ScientistOffer"
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
 * input type for inserting array relation for remote table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_arr_rel_insert_input {
  data: ScientistOffer_insert_input[];
  on_conflict?: ScientistOffer_on_conflict | null;
}

/**
 * order by avg() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_avg_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.ScientistOffer". All fields are combined with a logical 'AND'.
 */
export interface ScientistOffer_bool_exp {
  Program?: Program_bool_exp | null;
  SchoolClassRequests?: SchoolClassRequest_bool_exp | null;
  SchoolClassRequests_aggregate?: SchoolClassRequest_aggregate_bool_exp | null;
  ScientistOfferRelations?: ScientistOfferRelation_bool_exp | null;
  ScientistOfferRelations_aggregate?: ScientistOfferRelation_aggregate_bool_exp | null;
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
 * input type for inserting data into table "rentAScientist.ScientistOffer"
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
 * order by max() on columns of table "rentAScientist.ScientistOffer"
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
 * order by min() on columns of table "rentAScientist.ScientistOffer"
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
 * input type for inserting object relation for remote table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_obj_rel_insert_input {
  data: ScientistOffer_insert_input;
  on_conflict?: ScientistOffer_on_conflict | null;
}

/**
 * on_conflict condition type for table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_on_conflict {
  constraint: ScientistOffer_constraint;
  update_columns: ScientistOffer_update_column[];
  where?: ScientistOffer_bool_exp | null;
}

/**
 * order by stddev() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_stddev_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_stddev_pop_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_stddev_samp_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by sum() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_sum_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_var_pop_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_var_samp_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * order by variance() on columns of table "rentAScientist.ScientistOffer"
 */
export interface ScientistOffer_variance_order_by {
  id?: order_by | null;
  maxDeployments?: order_by | null;
  maximumGrade?: order_by | null;
  minimumGrade?: order_by | null;
  programId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "rentAScientist.Scientist". All fields are combined with a logical 'AND'.
 */
export interface Scientist_bool_exp {
  ScientistOfferRelations?: ScientistOfferRelation_bool_exp | null;
  ScientistOfferRelations_aggregate?: ScientistOfferRelation_aggregate_bool_exp | null;
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
 * input type for inserting data into table "rentAScientist.Scientist"
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
 * input type for inserting object relation for remote table "rentAScientist.Scientist"
 */
export interface Scientist_obj_rel_insert_input {
  data: Scientist_insert_input;
  on_conflict?: Scientist_on_conflict | null;
}

/**
 * on_conflict condition type for table "rentAScientist.Scientist"
 */
export interface Scientist_on_conflict {
  constraint: Scientist_constraint;
  update_columns: Scientist_update_column[];
  where?: Scientist_bool_exp | null;
}

export interface SessionAddress_aggregate_bool_exp {
  count?: SessionAddress_aggregate_bool_exp_count | null;
}

export interface SessionAddress_aggregate_bool_exp_count {
  arguments?: SessionAddress_select_column[] | null;
  distinct?: boolean | null;
  filter?: SessionAddress_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "SessionAddress"
 */
export interface SessionAddress_aggregate_order_by {
  avg?: SessionAddress_avg_order_by | null;
  count?: order_by | null;
  max?: SessionAddress_max_order_by | null;
  min?: SessionAddress_min_order_by | null;
  stddev?: SessionAddress_stddev_order_by | null;
  stddev_pop?: SessionAddress_stddev_pop_order_by | null;
  stddev_samp?: SessionAddress_stddev_samp_order_by | null;
  sum?: SessionAddress_sum_order_by | null;
  var_pop?: SessionAddress_var_pop_order_by | null;
  var_samp?: SessionAddress_var_samp_order_by | null;
  variance?: SessionAddress_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "SessionAddress"
 */
export interface SessionAddress_arr_rel_insert_input {
  data: SessionAddress_insert_input[];
  on_conflict?: SessionAddress_on_conflict | null;
}

/**
 * order by avg() on columns of table "SessionAddress"
 */
export interface SessionAddress_avg_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "SessionAddress". All fields are combined with a logical 'AND'.
 */
export interface SessionAddress_bool_exp {
  CourseLocation?: CourseLocation_bool_exp | null;
  LocationAddress?: LocationAddress_bool_exp | null;
  Session?: Session_bool_exp | null;
  _and?: SessionAddress_bool_exp[] | null;
  _not?: SessionAddress_bool_exp | null;
  _or?: SessionAddress_bool_exp[] | null;
  address?: String_comparison_exp | null;
  courseLocationId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  locationAddressId?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "SessionAddress"
 */
export interface SessionAddress_insert_input {
  CourseLocation?: CourseLocation_obj_rel_insert_input | null;
  LocationAddress?: LocationAddress_obj_rel_insert_input | null;
  Session?: Session_obj_rel_insert_input | null;
  address?: string | null;
  courseLocationId?: number | null;
  created_at?: any | null;
  id?: number | null;
  locationAddressId?: number | null;
  sessionId?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "SessionAddress"
 */
export interface SessionAddress_max_order_by {
  address?: order_by | null;
  courseLocationId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "SessionAddress"
 */
export interface SessionAddress_min_order_by {
  address?: order_by | null;
  courseLocationId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
  updated_at?: order_by | null;
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
 * order by stddev() on columns of table "SessionAddress"
 */
export interface SessionAddress_stddev_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "SessionAddress"
 */
export interface SessionAddress_stddev_pop_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "SessionAddress"
 */
export interface SessionAddress_stddev_samp_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by sum() on columns of table "SessionAddress"
 */
export interface SessionAddress_sum_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "SessionAddress"
 */
export interface SessionAddress_var_pop_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "SessionAddress"
 */
export interface SessionAddress_var_samp_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by variance() on columns of table "SessionAddress"
 */
export interface SessionAddress_variance_order_by {
  courseLocationId?: order_by | null;
  id?: order_by | null;
  locationAddressId?: order_by | null;
  sessionId?: order_by | null;
}

export interface SessionSpeaker_aggregate_bool_exp {
  count?: SessionSpeaker_aggregate_bool_exp_count | null;
}

export interface SessionSpeaker_aggregate_bool_exp_count {
  arguments?: SessionSpeaker_select_column[] | null;
  distinct?: boolean | null;
  filter?: SessionSpeaker_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "SessionSpeaker"
 */
export interface SessionSpeaker_aggregate_order_by {
  avg?: SessionSpeaker_avg_order_by | null;
  count?: order_by | null;
  max?: SessionSpeaker_max_order_by | null;
  min?: SessionSpeaker_min_order_by | null;
  stddev?: SessionSpeaker_stddev_order_by | null;
  stddev_pop?: SessionSpeaker_stddev_pop_order_by | null;
  stddev_samp?: SessionSpeaker_stddev_samp_order_by | null;
  sum?: SessionSpeaker_sum_order_by | null;
  var_pop?: SessionSpeaker_var_pop_order_by | null;
  var_samp?: SessionSpeaker_var_samp_order_by | null;
  variance?: SessionSpeaker_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "SessionSpeaker"
 */
export interface SessionSpeaker_arr_rel_insert_input {
  data: SessionSpeaker_insert_input[];
  on_conflict?: SessionSpeaker_on_conflict | null;
}

/**
 * order by avg() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_avg_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "SessionSpeaker". All fields are combined with a logical 'AND'.
 */
export interface SessionSpeaker_bool_exp {
  Session?: Session_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: SessionSpeaker_bool_exp[] | null;
  _not?: SessionSpeaker_bool_exp | null;
  _or?: SessionSpeaker_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  sessionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "SessionSpeaker"
 */
export interface SessionSpeaker_insert_input {
  Session?: Session_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  sessionId?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  sessionId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  sessionId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * order by stddev() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_stddev_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_stddev_pop_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_stddev_samp_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by sum() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_sum_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_var_pop_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_var_samp_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

/**
 * order by variance() on columns of table "SessionSpeaker"
 */
export interface SessionSpeaker_variance_order_by {
  id?: order_by | null;
  sessionId?: order_by | null;
}

export interface Session_aggregate_bool_exp {
  bool_and?: Session_aggregate_bool_exp_bool_and | null;
  bool_or?: Session_aggregate_bool_exp_bool_or | null;
  count?: Session_aggregate_bool_exp_count | null;
}

export interface Session_aggregate_bool_exp_bool_and {
  arguments: Session_select_column_Session_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: Session_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Session_aggregate_bool_exp_bool_or {
  arguments: Session_select_column_Session_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: Session_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Session_aggregate_bool_exp_count {
  arguments?: Session_select_column[] | null;
  distinct?: boolean | null;
  filter?: Session_bool_exp | null;
  predicate: Int_comparison_exp;
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
  Attendances?: Attendance_bool_exp | null;
  Attendances_aggregate?: Attendance_aggregate_bool_exp | null;
  Course?: Course_bool_exp | null;
  SessionAddresses?: SessionAddress_bool_exp | null;
  SessionAddresses_aggregate?: SessionAddress_aggregate_bool_exp | null;
  SessionSpeakers?: SessionSpeaker_bool_exp | null;
  SessionSpeakers_aggregate?: SessionSpeaker_aggregate_bool_exp | null;
  _and?: Session_bool_exp[] | null;
  _not?: Session_bool_exp | null;
  _or?: Session_bool_exp[] | null;
  attendanceData?: String_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  endDateTime?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  questionaire_sent?: Boolean_comparison_exp | null;
  startDateTime?: timestamptz_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Session"
 */
export interface Session_insert_input {
  Attendances?: Attendance_arr_rel_insert_input | null;
  Course?: Course_obj_rel_insert_input | null;
  SessionAddresses?: SessionAddress_arr_rel_insert_input | null;
  SessionSpeakers?: SessionSpeaker_arr_rel_insert_input | null;
  attendanceData?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  description?: string | null;
  endDateTime?: any | null;
  id?: number | null;
  questionaire_sent?: boolean | null;
  startDateTime?: any | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "Session"
 */
export interface Session_max_order_by {
  attendanceData?: order_by | null;
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
  attendanceData?: order_by | null;
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
 * Boolean expression to filter rows from the table "rentAScientist.Teacher". All fields are combined with a logical 'AND'.
 */
export interface Teacher_bool_exp {
  SchoolClasses?: SchoolClass_bool_exp | null;
  SchoolClasses_aggregate?: SchoolClass_aggregate_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: Teacher_bool_exp[] | null;
  _not?: Teacher_bool_exp | null;
  _or?: Teacher_bool_exp[] | null;
  id?: Int_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "rentAScientist.Teacher"
 */
export interface Teacher_insert_input {
  SchoolClasses?: SchoolClass_arr_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  id?: number | null;
  userId?: any | null;
}

/**
 * input type for inserting object relation for remote table "rentAScientist.Teacher"
 */
export interface Teacher_obj_rel_insert_input {
  data: Teacher_insert_input;
  on_conflict?: Teacher_on_conflict | null;
}

/**
 * on_conflict condition type for table "rentAScientist.Teacher"
 */
export interface Teacher_on_conflict {
  constraint: Teacher_constraint;
  update_columns: Teacher_update_column[];
  where?: Teacher_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "UserOccupation". All fields are combined with a logical 'AND'.
 */
export interface UserOccupation_bool_exp {
  Users?: User_bool_exp | null;
  Users_aggregate?: User_aggregate_bool_exp | null;
  _and?: UserOccupation_bool_exp[] | null;
  _not?: UserOccupation_bool_exp | null;
  _or?: UserOccupation_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "UserOccupation_enum". All fields are combined with logical 'AND'.
 */
export interface UserOccupation_enum_comparison_exp {
  _eq?: UserOccupation_enum | null;
  _in?: UserOccupation_enum[] | null;
  _is_null?: boolean | null;
  _neq?: UserOccupation_enum | null;
  _nin?: UserOccupation_enum[] | null;
}

/**
 * input type for inserting data into table "UserOccupation"
 */
export interface UserOccupation_insert_input {
  Users?: User_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "UserOccupation"
 */
export interface UserOccupation_obj_rel_insert_input {
  data: UserOccupation_insert_input;
  on_conflict?: UserOccupation_on_conflict | null;
}

/**
 * on_conflict condition type for table "UserOccupation"
 */
export interface UserOccupation_on_conflict {
  constraint: UserOccupation_constraint;
  update_columns: UserOccupation_update_column[];
  where?: UserOccupation_bool_exp | null;
}

/**
 * Ordering options when selecting data from "UserOccupation".
 */
export interface UserOccupation_order_by {
  Users_aggregate?: User_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "UserStatus". All fields are combined with a logical 'AND'.
 */
export interface UserStatus_bool_exp {
  Users?: User_bool_exp | null;
  Users_aggregate?: User_aggregate_bool_exp | null;
  _and?: UserStatus_bool_exp[] | null;
  _not?: UserStatus_bool_exp | null;
  _or?: UserStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "UserStatus_enum". All fields are combined with logical 'AND'.
 */
export interface UserStatus_enum_comparison_exp {
  _eq?: UserStatus_enum | null;
  _in?: UserStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: UserStatus_enum | null;
  _nin?: UserStatus_enum[] | null;
}

/**
 * input type for inserting data into table "UserStatus"
 */
export interface UserStatus_insert_input {
  Users?: User_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "UserStatus"
 */
export interface UserStatus_obj_rel_insert_input {
  data: UserStatus_insert_input;
  on_conflict?: UserStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "UserStatus"
 */
export interface UserStatus_on_conflict {
  constraint: UserStatus_constraint;
  update_columns: UserStatus_update_column[];
  where?: UserStatus_bool_exp | null;
}

/**
 * Ordering options when selecting data from "UserStatus".
 */
export interface UserStatus_order_by {
  Users_aggregate?: User_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface User_aggregate_bool_exp {
  bool_and?: User_aggregate_bool_exp_bool_and | null;
  bool_or?: User_aggregate_bool_exp_bool_or | null;
  count?: User_aggregate_bool_exp_count | null;
}

export interface User_aggregate_bool_exp_bool_and {
  arguments: User_select_column_User_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: User_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface User_aggregate_bool_exp_bool_or {
  arguments: User_select_column_User_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: User_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface User_aggregate_bool_exp_count {
  arguments?: User_select_column[] | null;
  distinct?: boolean | null;
  filter?: User_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "User"
 */
export interface User_aggregate_order_by {
  avg?: User_avg_order_by | null;
  count?: order_by | null;
  max?: User_max_order_by | null;
  min?: User_min_order_by | null;
  stddev?: User_stddev_order_by | null;
  stddev_pop?: User_stddev_pop_order_by | null;
  stddev_samp?: User_stddev_samp_order_by | null;
  sum?: User_sum_order_by | null;
  var_pop?: User_var_pop_order_by | null;
  var_samp?: User_var_samp_order_by | null;
  variance?: User_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "User"
 */
export interface User_arr_rel_insert_input {
  data: User_insert_input[];
  on_conflict?: User_on_conflict | null;
}

/**
 * order by avg() on columns of table "User"
 */
export interface User_avg_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "User". All fields are combined with a logical 'AND'.
 */
export interface User_bool_exp {
  AchievementOptionMentors?: AchievementOptionMentor_bool_exp | null;
  AchievementOptionMentors_aggregate?: AchievementOptionMentor_aggregate_bool_exp | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_bool_exp | null;
  AchievementRecordAuthors_aggregate?: AchievementRecordAuthor_aggregate_bool_exp | null;
  Attendances?: Attendance_bool_exp | null;
  Attendances_aggregate?: Attendance_aggregate_bool_exp | null;
  Country?: Country_bool_exp | null;
  CourseEnrollments?: CourseEnrollment_bool_exp | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_bool_exp | null;
  CourseInstructors?: CourseInstructor_bool_exp | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  OrganizationAdmins?: OrganizationAdmin_bool_exp | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_bool_exp | null;
  SessionSpeakers?: SessionSpeaker_bool_exp | null;
  SessionSpeakers_aggregate?: SessionSpeaker_aggregate_bool_exp | null;
  UserOccupation?: UserOccupation_bool_exp | null;
  UserStatus?: UserStatus_bool_exp | null;
  _and?: User_bool_exp[] | null;
  _not?: User_bool_exp | null;
  _or?: User_bool_exp[] | null;
  anonymousId?: String_comparison_exp | null;
  country?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  email?: String_comparison_exp | null;
  externalProfile?: String_comparison_exp | null;
  firstName?: String_comparison_exp | null;
  id?: uuid_comparison_exp | null;
  integerId?: Int_comparison_exp | null;
  lastName?: String_comparison_exp | null;
  matriculationNumber?: String_comparison_exp | null;
  newsletterRegistration?: Boolean_comparison_exp | null;
  occupation?: UserOccupation_enum_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  picture?: String_comparison_exp | null;
  status?: UserStatus_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  zipCode?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "User"
 */
export interface User_insert_input {
  AchievementOptionMentors?: AchievementOptionMentor_arr_rel_insert_input | null;
  AchievementRecordAuthors?: AchievementRecordAuthor_arr_rel_insert_input | null;
  Attendances?: Attendance_arr_rel_insert_input | null;
  Country?: Country_obj_rel_insert_input | null;
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  OrganizationAdmins?: OrganizationAdmin_arr_rel_insert_input | null;
  SessionSpeakers?: SessionSpeaker_arr_rel_insert_input | null;
  UserOccupation?: UserOccupation_obj_rel_insert_input | null;
  UserStatus?: UserStatus_obj_rel_insert_input | null;
  anonymousId?: string | null;
  country?: string | null;
  created_at?: any | null;
  email?: string | null;
  externalProfile?: string | null;
  firstName?: string | null;
  id?: any | null;
  integerId?: number | null;
  lastName?: string | null;
  matriculationNumber?: string | null;
  newsletterRegistration?: boolean | null;
  occupation?: UserOccupation_enum | null;
  organizationId?: number | null;
  picture?: string | null;
  status?: UserStatus_enum | null;
  updated_at?: any | null;
  zipCode?: string | null;
}

/**
 * order by max() on columns of table "User"
 */
export interface User_max_order_by {
  anonymousId?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  organizationId?: order_by | null;
  picture?: order_by | null;
  updated_at?: order_by | null;
  zipCode?: order_by | null;
}

/**
 * order by min() on columns of table "User"
 */
export interface User_min_order_by {
  anonymousId?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  organizationId?: order_by | null;
  picture?: order_by | null;
  updated_at?: order_by | null;
  zipCode?: order_by | null;
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
  AchievementOptionMentors_aggregate?: AchievementOptionMentor_aggregate_order_by | null;
  AchievementRecordAuthors_aggregate?: AchievementRecordAuthor_aggregate_order_by | null;
  Attendances_aggregate?: Attendance_aggregate_order_by | null;
  Country?: Country_order_by | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_order_by | null;
  Organization?: Organization_order_by | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_order_by | null;
  SessionSpeakers_aggregate?: SessionSpeaker_aggregate_order_by | null;
  UserOccupation?: UserOccupation_order_by | null;
  UserStatus?: UserStatus_order_by | null;
  anonymousId?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  newsletterRegistration?: order_by | null;
  occupation?: order_by | null;
  organizationId?: order_by | null;
  picture?: order_by | null;
  status?: order_by | null;
  updated_at?: order_by | null;
  zipCode?: order_by | null;
}

/**
 * order by stddev() on columns of table "User"
 */
export interface User_stddev_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "User"
 */
export interface User_stddev_pop_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "User"
 */
export interface User_stddev_samp_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "User"
 */
export interface User_sum_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "User"
 */
export interface User_var_pop_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "User"
 */
export interface User_var_samp_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "User"
 */
export interface User_variance_order_by {
  integerId?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Weekday". All fields are combined with a logical 'AND'.
 */
export interface Weekday_bool_exp {
  _and?: Weekday_bool_exp[] | null;
  _not?: Weekday_bool_exp | null;
  _or?: Weekday_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "Weekday_enum". All fields are combined with logical 'AND'.
 */
export interface Weekday_enum_comparison_exp {
  _eq?: Weekday_enum | null;
  _in?: Weekday_enum[] | null;
  _is_null?: boolean | null;
  _neq?: Weekday_enum | null;
  _nin?: Weekday_enum[] | null;
}

/**
 * input type for inserting data into table "Weekday"
 */
export interface Weekday_insert_input {
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "Weekday"
 */
export interface Weekday_obj_rel_insert_input {
  data: Weekday_insert_input;
  on_conflict?: Weekday_on_conflict | null;
}

/**
 * on_conflict condition type for table "Weekday"
 */
export interface Weekday_on_conflict {
  constraint: Weekday_constraint;
  update_columns: Weekday_update_column[];
  where?: Weekday_bool_exp | null;
}

/**
 * Ordering options when selecting data from "Weekday".
 */
export interface Weekday_order_by {
  comment?: order_by | null;
  value?: order_by | null;
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

export interface jsonb_cast_exp {
  String?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'.
 */
export interface jsonb_comparison_exp {
  _cast?: jsonb_cast_exp | null;
  _contained_in?: any | null;
  _contains?: any | null;
  _eq?: any | null;
  _gt?: any | null;
  _gte?: any | null;
  _has_key?: string | null;
  _has_keys_all?: string[] | null;
  _has_keys_any?: string[] | null;
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
 * Boolean expression to compare columns of type "time". All fields are combined with logical 'AND'.
 */
export interface time_comparison_exp {
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
