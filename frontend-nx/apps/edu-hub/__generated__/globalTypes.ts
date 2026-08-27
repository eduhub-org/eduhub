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
  description = "description",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  published = "published",
  recordType = "recordType",
  title = "title",
  updated_at = "updated_at",
}

/**
 * select "AchievementOption_aggregate_bool_exp_bool_and_arguments_columns" columns of table "AchievementOption"
 */
export enum AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_and_arguments_columns {
  published = "published",
}

/**
 * select "AchievementOption_aggregate_bool_exp_bool_or_arguments_columns" columns of table "AchievementOption"
 */
export enum AchievementOption_select_column_AchievementOption_aggregate_bool_exp_bool_or_arguments_columns {
  published = "published",
}

/**
 * update columns of table "AchievementOption"
 */
export enum AchievementOption_update_column {
  achievementDocumentationTemplateId = "achievementDocumentationTemplateId",
  created_at = "created_at",
  description = "description",
  evaluationScriptUrl = "evaluationScriptUrl",
  id = "id",
  published = "published",
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
 * unique or primary key constraints on table "AppSettings"
 */
export enum AppSettings_constraint {
  AppSettings_app_key = "AppSettings_app_key",
  AppSettings_domain_unique = "AppSettings_domain_unique",
  AppSettings_pkey = "AppSettings_pkey",
}

/**
 * update columns of table "AppSettings"
 */
export enum AppSettings_update_column {
  appName = "appName",
  backgroundImageURL = "backgroundImageURL",
  bannerBackgroundColor = "bannerBackgroundColor",
  bannerFontColor = "bannerFontColor",
  bannerTextDe = "bannerTextDe",
  bannerTextEn = "bannerTextEn",
  created_at = "created_at",
  defaultLocale = "defaultLocale",
  domain = "domain",
  faqCollectionName = "faqCollectionName",
  faviconUrl = "faviconUrl",
  guestDataRetentionMonths = "guestDataRetentionMonths",
  imprintUrl = "imprintUrl",
  logoUrl = "logoUrl",
  previewImageURL = "previewImageURL",
  primaryColor = "primaryColor",
  privacyUrl = "privacyUrl",
  secondaryColor = "secondaryColor",
  showFaqSection = "showFaqSection",
  timeZone = "timeZone",
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
 * select columns of table "Attendance"
 */
export enum Attendance_select_column {
  created_at = "created_at",
  endDateTime = "endDateTime",
  id = "id",
  interruptionCount = "interruptionCount",
  location = "location",
  matchType = "matchType",
  recordedIdentifier = "recordedIdentifier",
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
  matchType = "matchType",
  recordedIdentifier = "recordedIdentifier",
  sessionId = "sessionId",
  source = "source",
  startDateTime = "startDateTime",
  status = "status",
  totalAttendanceTime = "totalAttendanceTime",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "Badge"
 */
export enum Badge_constraint {
  Badge_pkey = "Badge_pkey",
}

/**
 * update columns of table "Badge"
 */
export enum Badge_update_column {
  created_at = "created_at",
  description = "description",
  icon = "icon",
  id = "id",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "CertificateTemplate"
 */
export enum CertificateTemplate_constraint {
  CertificateTemplate_name_key = "CertificateTemplate_name_key",
  CertificateTemplate_pkey = "CertificateTemplate_pkey",
}

/**
 * update columns of table "CertificateTemplate"
 */
export enum CertificateTemplate_update_column {
  created_at = "created_at",
  html = "html",
  id = "id",
  name = "name",
  updated_at = "updated_at",
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
 * unique or primary key constraints on table "CourseAddonMapping"
 */
export enum CourseAddonMapping_constraint {
  CourseAddonMapping_pkey = "CourseAddonMapping_pkey",
  CourseAddonMapping_unique_no_choice = "CourseAddonMapping_unique_no_choice",
  CourseAddonMapping_unique_with_choice = "CourseAddonMapping_unique_with_choice",
}

/**
 * select columns of table "CourseAddonMapping"
 */
export enum CourseAddonMapping_select_column {
  choiceId = "choiceId",
  confidence = "confidence",
  courseId = "courseId",
  created_at = "created_at",
  currency = "currency",
  description = "description",
  extractedPrice = "extractedPrice",
  id = "id",
  questionId = "questionId",
  questionTextDe = "questionTextDe",
  questionTextEn = "questionTextEn",
  stripePriceId = "stripePriceId",
  stripeProductId = "stripeProductId",
  updated_at = "updated_at",
  validatedAt = "validatedAt",
  validatedBy = "validatedBy",
  validatedPrice = "validatedPrice",
}

/**
 * update columns of table "CourseAddonMapping"
 */
export enum CourseAddonMapping_update_column {
  choiceId = "choiceId",
  confidence = "confidence",
  courseId = "courseId",
  created_at = "created_at",
  currency = "currency",
  description = "description",
  extractedPrice = "extractedPrice",
  id = "id",
  questionId = "questionId",
  questionTextDe = "questionTextDe",
  questionTextEn = "questionTextEn",
  stripePriceId = "stripePriceId",
  stripeProductId = "stripeProductId",
  updated_at = "updated_at",
  validatedAt = "validatedAt",
  validatedBy = "validatedBy",
  validatedPrice = "validatedPrice",
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
 * unique or primary key constraints on table "CourseEnrollmentAddon"
 */
export enum CourseEnrollmentAddon_constraint {
  CourseEnrollmentAddon_enrollmentId_addonMappingId_key = "CourseEnrollmentAddon_enrollmentId_addonMappingId_key",
  CourseEnrollmentAddon_pkey = "CourseEnrollmentAddon_pkey",
}

/**
 * select columns of table "CourseEnrollmentAddon"
 */
export enum CourseEnrollmentAddon_select_column {
  addonMappingId = "addonMappingId",
  created_at = "created_at",
  currency = "currency",
  enrollmentId = "enrollmentId",
  id = "id",
  priceAtPurchase = "priceAtPurchase",
}

/**
 * update columns of table "CourseEnrollmentAddon"
 */
export enum CourseEnrollmentAddon_update_column {
  addonMappingId = "addonMappingId",
  created_at = "created_at",
  currency = "currency",
  enrollmentId = "enrollmentId",
  id = "id",
  priceAtPurchase = "priceAtPurchase",
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
  WAITLIST = "WAITLIST",
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
  billingOrganizationId = "billingOrganizationId",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  invitationExpirationDate = "invitationExpirationDate",
  location = "location",
  motivationLetter = "motivationLetter",
  motivationRating = "motivationRating",
  status = "status",
  termsAcceptedAt = "termsAcceptedAt",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "CourseEnrollment"
 */
export enum CourseEnrollment_update_column {
  achievementCertificateURL = "achievementCertificateURL",
  attendanceCertificateURL = "attendanceCertificateURL",
  billingOrganizationId = "billingOrganizationId",
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  invitationExpirationDate = "invitationExpirationDate",
  location = "location",
  motivationLetter = "motivationLetter",
  motivationRating = "motivationRating",
  status = "status",
  termsAcceptedAt = "termsAcceptedAt",
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
  contentType = "contentType",
  created_at = "created_at",
  id = "id",
  order = "order",
  organizationId = "organizationId",
  programType = "programType",
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
  DIRECT_CONFIRMATION_AND_PAYMENT = "DIRECT_CONFIRMATION_AND_PAYMENT",
  DIRECT_WITH_INPUT = "DIRECT_WITH_INPUT",
  DIRECT_WITH_INPUT_AND_PAYMENT = "DIRECT_WITH_INPUT_AND_PAYMENT",
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
 * unique or primary key constraints on table "CourseSeries"
 */
export enum CourseSeries_constraint {
  CourseSeries_pkey = "CourseSeries_pkey",
}

/**
 * update columns of table "CourseSeries"
 */
export enum CourseSeries_update_column {
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  title = "title",
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
 * select columns of table "Course"
 */
export enum Course_select_column {
  achievementCertificatePossible = "achievementCertificatePossible",
  achievementCertificateTemplateId = "achievementCertificateTemplateId",
  applicationEnd = "applicationEnd",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  attendanceCertificateTemplateId = "attendanceCertificateTemplateId",
  basePrice = "basePrice",
  chatLink = "chatLink",
  contentDescriptionField1 = "contentDescriptionField1",
  contentDescriptionField2 = "contentDescriptionField2",
  cost = "cost",
  courseSeriesId = "courseSeriesId",
  coverImage = "coverImage",
  created_at = "created_at",
  currency = "currency",
  ects = "ects",
  endTime = "endTime",
  externalRegistrationLink = "externalRegistrationLink",
  formbricksEnrollmentSurveyUrl = "formbricksEnrollmentSurveyUrl",
  guestRegistrationEnabled = "guestRegistrationEnabled",
  headingDescriptionField1 = "headingDescriptionField1",
  headingDescriptionField2 = "headingDescriptionField2",
  id = "id",
  language = "language",
  learningGoals = "learningGoals",
  matrixRoomId = "matrixRoomId",
  maxMissedSessions = "maxMissedSessions",
  maxParticipants = "maxParticipants",
  programId = "programId",
  projectProposalsEnabled = "projectProposalsEnabled",
  projectSubmissionDeadline = "projectSubmissionDeadline",
  published = "published",
  registrationType = "registrationType",
  requiredEcts = "requiredEcts",
  requiredEventCount = "requiredEventCount",
  startTime = "startTime",
  status = "status",
  stripePriceId = "stripePriceId",
  stripeProductId = "stripeProductId",
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
  guestRegistrationEnabled = "guestRegistrationEnabled",
  projectProposalsEnabled = "projectProposalsEnabled",
  published = "published",
}

/**
 * select "Course_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Course"
 */
export enum Course_select_column_Course_aggregate_bool_exp_bool_or_arguments_columns {
  achievementCertificatePossible = "achievementCertificatePossible",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  guestRegistrationEnabled = "guestRegistrationEnabled",
  projectProposalsEnabled = "projectProposalsEnabled",
  published = "published",
}

/**
 * update columns of table "Course"
 */
export enum Course_update_column {
  achievementCertificatePossible = "achievementCertificatePossible",
  achievementCertificateTemplateId = "achievementCertificateTemplateId",
  applicationEnd = "applicationEnd",
  attendanceCertificatePossible = "attendanceCertificatePossible",
  attendanceCertificateTemplateId = "attendanceCertificateTemplateId",
  basePrice = "basePrice",
  chatLink = "chatLink",
  contentDescriptionField1 = "contentDescriptionField1",
  contentDescriptionField2 = "contentDescriptionField2",
  cost = "cost",
  courseSeriesId = "courseSeriesId",
  coverImage = "coverImage",
  created_at = "created_at",
  currency = "currency",
  ects = "ects",
  endTime = "endTime",
  externalRegistrationLink = "externalRegistrationLink",
  formbricksEnrollmentSurveyUrl = "formbricksEnrollmentSurveyUrl",
  guestRegistrationEnabled = "guestRegistrationEnabled",
  headingDescriptionField1 = "headingDescriptionField1",
  headingDescriptionField2 = "headingDescriptionField2",
  id = "id",
  language = "language",
  learningGoals = "learningGoals",
  matrixRoomId = "matrixRoomId",
  maxMissedSessions = "maxMissedSessions",
  maxParticipants = "maxParticipants",
  programId = "programId",
  projectProposalsEnabled = "projectProposalsEnabled",
  projectSubmissionDeadline = "projectSubmissionDeadline",
  published = "published",
  registrationType = "registrationType",
  requiredEcts = "requiredEcts",
  requiredEventCount = "requiredEventCount",
  startTime = "startTime",
  status = "status",
  stripePriceId = "stripePriceId",
  stripeProductId = "stripeProductId",
  tagline = "tagline",
  title = "title",
  updated_at = "updated_at",
  weekDay = "weekDay",
}

/**
 * unique or primary key constraints on table "InvoiceStatus"
 */
export enum InvoiceStatus_constraint {
  InvoiceStatus_pkey = "InvoiceStatus_pkey",
}

export enum InvoiceStatus_enum {
  CANCELLED = "CANCELLED",
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  OVERDUE = "OVERDUE",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

/**
 * update columns of table "InvoiceStatus"
 */
export enum InvoiceStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "Invoice"
 */
export enum Invoice_constraint {
  Invoice_invoiceNumber_key = "Invoice_invoiceNumber_key",
  Invoice_pkey = "Invoice_pkey",
  Invoice_stripeInvoiceId_key = "Invoice_stripeInvoiceId_key",
}

/**
 * select columns of table "Invoice"
 */
export enum Invoice_select_column {
  courseEnrollmentId = "courseEnrollmentId",
  created_at = "created_at",
  currency = "currency",
  grossTotal = "grossTotal",
  id = "id",
  invoiceDate = "invoiceDate",
  invoiceNumber = "invoiceNumber",
  jobPostingId = "jobPostingId",
  netTotal = "netTotal",
  notes = "notes",
  organizationId = "organizationId",
  status = "status",
  stripeCheckoutSessionId = "stripeCheckoutSessionId",
  stripeHostedInvoiceUrl = "stripeHostedInvoiceUrl",
  stripeInvoiceId = "stripeInvoiceId",
  stripeInvoicePdfUrl = "stripeInvoicePdfUrl",
  stripePaymentIntentId = "stripePaymentIntentId",
  updated_at = "updated_at",
  userId = "userId",
  vatTotal = "vatTotal",
}

/**
 * update columns of table "Invoice"
 */
export enum Invoice_update_column {
  courseEnrollmentId = "courseEnrollmentId",
  created_at = "created_at",
  currency = "currency",
  grossTotal = "grossTotal",
  id = "id",
  invoiceDate = "invoiceDate",
  invoiceNumber = "invoiceNumber",
  jobPostingId = "jobPostingId",
  netTotal = "netTotal",
  notes = "notes",
  organizationId = "organizationId",
  status = "status",
  stripeCheckoutSessionId = "stripeCheckoutSessionId",
  stripeHostedInvoiceUrl = "stripeHostedInvoiceUrl",
  stripeInvoiceId = "stripeInvoiceId",
  stripeInvoicePdfUrl = "stripeInvoicePdfUrl",
  stripePaymentIntentId = "stripePaymentIntentId",
  updated_at = "updated_at",
  userId = "userId",
  vatTotal = "vatTotal",
}

/**
 * unique or primary key constraints on table "JobOccupation"
 */
export enum JobOccupation_constraint {
  JobOccupation_pkey = "JobOccupation_pkey",
}

export enum JobOccupation_enum {
  ACCOUNTING = "ACCOUNTING",
  ADMINISTRATION = "ADMINISTRATION",
  AGRICULTURE_ENVIRONMENT = "AGRICULTURE_ENVIRONMENT",
  ARTS_CULTURE = "ARTS_CULTURE",
  BANKING_INSURANCE = "BANKING_INSURANCE",
  CONSULTING = "CONSULTING",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  DESIGN_ARCHITECTURE = "DESIGN_ARCHITECTURE",
  EDUCATION_TRAINING = "EDUCATION_TRAINING",
  ENGINEERING = "ENGINEERING",
  EVENT_MANAGEMENT = "EVENT_MANAGEMENT",
  HEALTH_SOCIAL = "HEALTH_SOCIAL",
  HOSPITALITY = "HOSPITALITY",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  IT_TELECOMMUNICATIONS = "IT_TELECOMMUNICATIONS",
  LEGAL = "LEGAL",
  MAINTENANCE = "MAINTENANCE",
  MANAGEMENT = "MANAGEMENT",
  MANUFACTURING_CONSTRUCTION = "MANUFACTURING_CONSTRUCTION",
  MARKETING_ADVERTISING = "MARKETING_ADVERTISING",
  MEDIA_EDITORIAL = "MEDIA_EDITORIAL",
  OTHER = "OTHER",
  PRODUCTION = "PRODUCTION",
  PROJECT_MANAGEMENT = "PROJECT_MANAGEMENT",
  PUBLIC_SERVICE = "PUBLIC_SERVICE",
  PURCHASING_LOGISTICS = "PURCHASING_LOGISTICS",
  QUALITY_MANAGEMENT = "QUALITY_MANAGEMENT",
  REAL_ESTATE = "REAL_ESTATE",
  RESEARCH_SCIENCE = "RESEARCH_SCIENCE",
  SALES_RETAIL = "SALES_RETAIL",
  SECURITY_CIVIL_PROTECTION = "SECURITY_CIVIL_PROTECTION",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  SOCIAL_PEDAGOGY = "SOCIAL_PEDAGOGY",
  TOURISM = "TOURISM",
}

/**
 * update columns of table "JobOccupation"
 */
export enum JobOccupation_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "JobPortal"
 */
export enum JobPortal_constraint {
  JobPortal_pkey = "JobPortal_pkey",
  JobPortal_slug_key = "JobPortal_slug_key",
}

/**
 * select columns of table "JobPortal"
 */
export enum JobPortal_select_column {
  appName = "appName",
  contactEmail = "contactEmail",
  created_at = "created_at",
  defaultRegion = "defaultRegion",
  id = "id",
  organizationId = "organizationId",
  slug = "slug",
  title = "title",
  updated_at = "updated_at",
}

/**
 * update columns of table "JobPortal"
 */
export enum JobPortal_update_column {
  appName = "appName",
  contactEmail = "contactEmail",
  created_at = "created_at",
  defaultRegion = "defaultRegion",
  id = "id",
  organizationId = "organizationId",
  slug = "slug",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "JobPostingCredit"
 */
export enum JobPostingCredit_constraint {
  JobPostingCredit_organizationId_jobPostingType_key = "JobPostingCredit_organizationId_jobPostingType_key",
  JobPostingCredit_organizationId_untyped_unique = "JobPostingCredit_organizationId_untyped_unique",
  JobPostingCredit_pkey = "JobPostingCredit_pkey",
}

/**
 * select columns of table "JobPostingCredit"
 */
export enum JobPostingCredit_select_column {
  created_at = "created_at",
  id = "id",
  jobPostingType = "jobPostingType",
  organizationId = "organizationId",
  remaining = "remaining",
  unlimited = "unlimited",
  updated_at = "updated_at",
}

/**
 * select "JobPostingCredit_aggregate_bool_exp_bool_and_arguments_columns" columns of table "JobPostingCredit"
 */
export enum JobPostingCredit_select_column_JobPostingCredit_aggregate_bool_exp_bool_and_arguments_columns {
  unlimited = "unlimited",
}

/**
 * select "JobPostingCredit_aggregate_bool_exp_bool_or_arguments_columns" columns of table "JobPostingCredit"
 */
export enum JobPostingCredit_select_column_JobPostingCredit_aggregate_bool_exp_bool_or_arguments_columns {
  unlimited = "unlimited",
}

/**
 * update columns of table "JobPostingCredit"
 */
export enum JobPostingCredit_update_column {
  created_at = "created_at",
  id = "id",
  jobPostingType = "jobPostingType",
  organizationId = "organizationId",
  remaining = "remaining",
  unlimited = "unlimited",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "JobPostingPrice"
 */
export enum JobPostingPrice_constraint {
  JobPostingPrice_jobPostingType_key = "JobPostingPrice_jobPostingType_key",
  JobPostingPrice_pkey = "JobPostingPrice_pkey",
}

/**
 * select columns of table "JobPostingPrice"
 */
export enum JobPostingPrice_select_column {
  created_at = "created_at",
  currency = "currency",
  durationDays = "durationDays",
  id = "id",
  jobPostingType = "jobPostingType",
  price = "price",
  stripePriceId = "stripePriceId",
  updated_at = "updated_at",
  vatRate = "vatRate",
}

/**
 * update columns of table "JobPostingPrice"
 */
export enum JobPostingPrice_update_column {
  created_at = "created_at",
  currency = "currency",
  durationDays = "durationDays",
  id = "id",
  jobPostingType = "jobPostingType",
  price = "price",
  stripePriceId = "stripePriceId",
  updated_at = "updated_at",
  vatRate = "vatRate",
}

/**
 * unique or primary key constraints on table "JobPostingStatus"
 */
export enum JobPostingStatus_constraint {
  JobPostingStatus_pkey = "JobPostingStatus_pkey",
}

export enum JobPostingStatus_enum {
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  EXPIRED = "EXPIRED",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PUBLISHED = "PUBLISHED",
}

/**
 * update columns of table "JobPostingStatus"
 */
export enum JobPostingStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "JobPostingTag"
 */
export enum JobPostingTag_constraint {
  JobPostingTag_jobPostingId_name_key = "JobPostingTag_jobPostingId_name_key",
  JobPostingTag_pkey = "JobPostingTag_pkey",
}

/**
 * select columns of table "JobPostingTag"
 */
export enum JobPostingTag_select_column {
  created_at = "created_at",
  id = "id",
  jobPostingId = "jobPostingId",
  name = "name",
  updated_at = "updated_at",
}

/**
 * update columns of table "JobPostingTag"
 */
export enum JobPostingTag_update_column {
  created_at = "created_at",
  id = "id",
  jobPostingId = "jobPostingId",
  name = "name",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "JobPostingType"
 */
export enum JobPostingType_constraint {
  JobPostingType_pkey = "JobPostingType_pkey",
}

export enum JobPostingType_enum {
  INTERNSHIP = "INTERNSHIP",
  MINIJOB = "MINIJOB",
  PERMANENT = "PERMANENT",
  STATE_RECOGNITION_INTERNSHIP = "STATE_RECOGNITION_INTERNSHIP",
  THESIS = "THESIS",
  TRAINEE = "TRAINEE",
  WORKING_STUDENT = "WORKING_STUDENT",
}

/**
 * update columns of table "JobPostingType"
 */
export enum JobPostingType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "JobPosting"
 */
export enum JobPosting_constraint {
  JobPosting_legacyStujoId_key = "JobPosting_legacyStujoId_key",
  JobPosting_pkey = "JobPosting_pkey",
}

/**
 * select columns of table "JobPosting"
 */
export enum JobPosting_select_column {
  applicationDeadline = "applicationDeadline",
  contactUserId = "contactUserId",
  created_at = "created_at",
  customCompany = "customCompany",
  description = "description",
  durationText = "durationText",
  expiresAt = "expiresAt",
  featured = "featured",
  hoursPerWeek = "hoursPerWeek",
  id = "id",
  international = "international",
  internationalDescription = "internationalDescription",
  language = "language",
  legacyStujoId = "legacyStujoId",
  location = "location",
  occupation = "occupation",
  organizationId = "organizationId",
  pdfUrl = "pdfUrl",
  publishedAt = "publishedAt",
  region = "region",
  requirement = "requirement",
  restrictedToOrganizationId = "restrictedToOrganizationId",
  salaryText = "salaryText",
  shortDescription = "shortDescription",
  slug = "slug",
  startText = "startText",
  status = "status",
  title = "title",
  type = "type",
  updated_at = "updated_at",
  views = "views",
  workExperienceRequired = "workExperienceRequired",
}

/**
 * select "JobPosting_aggregate_bool_exp_bool_and_arguments_columns" columns of table "JobPosting"
 */
export enum JobPosting_select_column_JobPosting_aggregate_bool_exp_bool_and_arguments_columns {
  featured = "featured",
  international = "international",
  workExperienceRequired = "workExperienceRequired",
}

/**
 * select "JobPosting_aggregate_bool_exp_bool_or_arguments_columns" columns of table "JobPosting"
 */
export enum JobPosting_select_column_JobPosting_aggregate_bool_exp_bool_or_arguments_columns {
  featured = "featured",
  international = "international",
  workExperienceRequired = "workExperienceRequired",
}

/**
 * update columns of table "JobPosting"
 */
export enum JobPosting_update_column {
  applicationDeadline = "applicationDeadline",
  contactUserId = "contactUserId",
  created_at = "created_at",
  customCompany = "customCompany",
  description = "description",
  durationText = "durationText",
  expiresAt = "expiresAt",
  featured = "featured",
  hoursPerWeek = "hoursPerWeek",
  id = "id",
  international = "international",
  internationalDescription = "internationalDescription",
  language = "language",
  legacyStujoId = "legacyStujoId",
  location = "location",
  occupation = "occupation",
  organizationId = "organizationId",
  pdfUrl = "pdfUrl",
  publishedAt = "publishedAt",
  region = "region",
  requirement = "requirement",
  restrictedToOrganizationId = "restrictedToOrganizationId",
  salaryText = "salaryText",
  shortDescription = "shortDescription",
  slug = "slug",
  startText = "startText",
  status = "status",
  title = "title",
  type = "type",
  updated_at = "updated_at",
  views = "views",
  workExperienceRequired = "workExperienceRequired",
}

/**
 * unique or primary key constraints on table "JobRegion"
 */
export enum JobRegion_constraint {
  JobRegion_pkey = "JobRegion_pkey",
}

export enum JobRegion_enum {
  ABROAD = "ABROAD",
  DENMARK = "DENMARK",
  FLENSBURG = "FLENSBURG",
  GERMANY = "GERMANY",
  KIEL = "KIEL",
  SCHLESWIG_HOLSTEIN_HAMBURG = "SCHLESWIG_HOLSTEIN_HAMBURG",
}

/**
 * update columns of table "JobRegion"
 */
export enum JobRegion_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "JobSliderJobType"
 */
export enum JobSliderJobType_constraint {
  JobSliderJobType_jobSliderOptionId_jobType_key = "JobSliderJobType_jobSliderOptionId_jobType_key",
  JobSliderJobType_pkey = "JobSliderJobType_pkey",
}

/**
 * select columns of table "JobSliderJobType"
 */
export enum JobSliderJobType_select_column {
  created_at = "created_at",
  id = "id",
  jobSliderOptionId = "jobSliderOptionId",
  jobType = "jobType",
  updated_at = "updated_at",
}

/**
 * update columns of table "JobSliderJobType"
 */
export enum JobSliderJobType_update_column {
  created_at = "created_at",
  id = "id",
  jobSliderOptionId = "jobSliderOptionId",
  jobType = "jobType",
  updated_at = "updated_at",
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
  HAMBURG = "HAMBURG",
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
 * unique or primary key constraints on table "MailTemplateType"
 */
export enum MailTemplateType_constraint {
  MailTemplateType_pkey = "MailTemplateType_pkey",
}

export enum MailTemplateType_enum {
  APPLICATION_CONFIRMED = "APPLICATION_CONFIRMED",
  APPLICATION_RECEIVED = "APPLICATION_RECEIVED",
  APPLICATION_RECEIVED_PAID = "APPLICATION_RECEIVED_PAID",
  CERTIFICATE_ACHIEVEMENT_READY = "CERTIFICATE_ACHIEVEMENT_READY",
  CERTIFICATE_ATTENDANCE_READY = "CERTIFICATE_ATTENDANCE_READY",
  COURSE_CONTINUATION_INQUIRY = "COURSE_CONTINUATION_INQUIRY",
  DECLINE = "DECLINE",
  ENROLLMENT_ABORTED = "ENROLLMENT_ABORTED",
  ENROLLMENT_CANCELLED = "ENROLLMENT_CANCELLED",
  GUEST_ALREADY_HAS_ACCOUNT = "GUEST_ALREADY_HAS_ACCOUNT",
  GUEST_REGISTRATION_CONFIRM = "GUEST_REGISTRATION_CONFIRM",
  INVITATION_EXPIRED = "INVITATION_EXPIRED",
  INVITATION_EXPIRING_SOON = "INVITATION_EXPIRING_SOON",
  INVITE = "INVITE",
  JOB_ALERT = "JOB_ALERT",
  JOB_POSTING_ADMIN_NOTICE = "JOB_POSTING_ADMIN_NOTICE",
  JOB_POSTING_EXPIRED = "JOB_POSTING_EXPIRED",
  JOB_POSTING_PAYMENT_FAILED = "JOB_POSTING_PAYMENT_FAILED",
  JOB_POSTING_PUBLISHED = "JOB_POSTING_PUBLISHED",
  ORGANIZER_ADDED = "ORGANIZER_ADDED",
  PAYMENT_RECEIPT = "PAYMENT_RECEIPT",
  PROJECT_APPROVED = "PROJECT_APPROVED",
  PROJECT_AUTHOR_EXCLUDED = "PROJECT_AUTHOR_EXCLUDED",
  PROJECT_DEADLINE_REMINDER = "PROJECT_DEADLINE_REMINDER",
  PROJECT_JOIN_ACCEPTED = "PROJECT_JOIN_ACCEPTED",
  PROJECT_JOIN_DECLINED = "PROJECT_JOIN_DECLINED",
  PROJECT_JOIN_REQUESTED = "PROJECT_JOIN_REQUESTED",
  PROJECT_REJECTED = "PROJECT_REJECTED",
  PROJECT_SENT_BACK = "PROJECT_SENT_BACK",
  PROJECT_SUBMITTED = "PROJECT_SUBMITTED",
  PROJECT_TEAM_CONFIRMED = "PROJECT_TEAM_CONFIRMED",
  REGISTRATION_CONFIRMED = "REGISTRATION_CONFIRMED",
  REGISTRATION_CONFIRMED_PAID = "REGISTRATION_CONFIRMED_PAID",
  SESSION_REMINDER = "SESSION_REMINDER",
  SESSION_RESCHEDULED = "SESSION_RESCHEDULED",
  USER_CREATED = "USER_CREATED",
  WAITLIST_NOTICE = "WAITLIST_NOTICE",
  WAITLIST_PROMOTED = "WAITLIST_PROMOTED",
}

/**
 * update columns of table "MailTemplateType"
 */
export enum MailTemplateType_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "MailTemplate"
 */
export enum MailTemplate_constraint {
  MailTemplate_pkey = "MailTemplate_pkey",
  MailTemplate_type_courseId_unique_not_null = "MailTemplate_type_courseId_unique_not_null",
  MailTemplate_type_unique_null = "MailTemplate_type_unique_null",
}

/**
 * select columns of table "MailTemplate"
 */
export enum MailTemplate_select_column {
  bcc = "bcc",
  cc = "cc",
  content = "content",
  courseId = "courseId",
  created_at = "created_at",
  from = "from",
  id = "id",
  subject = "subject",
  type = "type",
  updated_at = "updated_at",
}

/**
 * update columns of table "MailTemplate"
 */
export enum MailTemplate_update_column {
  bcc = "bcc",
  cc = "cc",
  content = "content",
  courseId = "courseId",
  created_at = "created_at",
  from = "from",
  id = "id",
  subject = "subject",
  type = "type",
  updated_at = "updated_at",
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
  canManageDegrees = "canManageDegrees",
  canManageEvents = "canManageEvents",
  canManageJobs = "canManageJobs",
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
  canManageDegrees = "canManageDegrees",
  canManageEvents = "canManageEvents",
  canManageJobs = "canManageJobs",
  canManageSettings = "canManageSettings",
}

/**
 * select "OrganizationAdmin_aggregate_bool_exp_bool_or_arguments_columns" columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_select_column_OrganizationAdmin_aggregate_bool_exp_bool_or_arguments_columns {
  canManageCourses = "canManageCourses",
  canManageDegrees = "canManageDegrees",
  canManageEvents = "canManageEvents",
  canManageJobs = "canManageJobs",
  canManageSettings = "canManageSettings",
}

/**
 * update columns of table "OrganizationAdmin"
 */
export enum OrganizationAdmin_update_column {
  canManageCourses = "canManageCourses",
  canManageDegrees = "canManageDegrees",
  canManageEvents = "canManageEvents",
  canManageJobs = "canManageJobs",
  canManageSettings = "canManageSettings",
  created_at = "created_at",
  id = "id",
  organizationId = "organizationId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "OrganizationNewsletterSubscription"
 */
export enum OrganizationNewsletterSubscription_constraint {
  OrganizationNewsletterSubscription_pkey = "OrganizationNewsletterSubscription_pkey",
}

/**
 * select columns of table "OrganizationNewsletterSubscription"
 */
export enum OrganizationNewsletterSubscription_select_column {
  created_at = "created_at",
  errorMessage = "errorMessage",
  externalSubscriberId = "externalSubscriberId",
  lastSyncedAt = "lastSyncedAt",
  organizationId = "organizationId",
  source = "source",
  status = "status",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "OrganizationNewsletterSubscription"
 */
export enum OrganizationNewsletterSubscription_update_column {
  created_at = "created_at",
  errorMessage = "errorMessage",
  externalSubscriberId = "externalSubscriberId",
  lastSyncedAt = "lastSyncedAt",
  organizationId = "organizationId",
  source = "source",
  status = "status",
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
  addressLine1 = "addressLine1",
  addressLine2 = "addressLine2",
  aliases = "aliases",
  apiKeyHash = "apiKeyHash",
  bankBic = "bankBic",
  bankIban = "bankIban",
  bankName = "bankName",
  city = "city",
  country = "country",
  created_at = "created_at",
  defaultTaxExemptionNote = "defaultTaxExemptionNote",
  defaultVatRate = "defaultVatRate",
  description = "description",
  email = "email",
  formbricksApiKey = "formbricksApiKey",
  formbricksApiUrl = "formbricksApiUrl",
  ghostNewsletterApiKeyConfigured = "ghostNewsletterApiKeyConfigured",
  ghostNewsletterApiKeyEncrypted = "ghostNewsletterApiKeyEncrypted",
  ghostNewsletterApiUrl = "ghostNewsletterApiUrl",
  ghostNewsletterDoubleOptInEnabled = "ghostNewsletterDoubleOptInEnabled",
  ghostNewsletterLabel = "ghostNewsletterLabel",
  ghostNewsletterListId = "ghostNewsletterListId",
  ghostNewsletterSlug = "ghostNewsletterSlug",
  id = "id",
  invoiceFooterText = "invoiceFooterText",
  invoiceNumberPrefix = "invoiceNumberPrefix",
  legalForm = "legalForm",
  legalName = "legalName",
  logo = "logo",
  managingDirector = "managingDirector",
  name = "name",
  newsletterDescription = "newsletterDescription",
  newsletterProvider = "newsletterProvider",
  phone = "phone",
  postalCode = "postalCode",
  registerCourt = "registerCourt",
  registerNumber = "registerNumber",
  stripePublishableKey = "stripePublishableKey",
  stripeSecretKey = "stripeSecretKey",
  stripeWebhookSecret = "stripeWebhookSecret",
  taxNumber = "taxNumber",
  type = "type",
  updated_at = "updated_at",
  vatId = "vatId",
  website = "website",
}

/**
 * select "Organization_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Organization"
 */
export enum Organization_select_column_Organization_aggregate_bool_exp_bool_and_arguments_columns {
  ghostNewsletterApiKeyConfigured = "ghostNewsletterApiKeyConfigured",
  ghostNewsletterDoubleOptInEnabled = "ghostNewsletterDoubleOptInEnabled",
}

/**
 * select "Organization_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Organization"
 */
export enum Organization_select_column_Organization_aggregate_bool_exp_bool_or_arguments_columns {
  ghostNewsletterApiKeyConfigured = "ghostNewsletterApiKeyConfigured",
  ghostNewsletterDoubleOptInEnabled = "ghostNewsletterDoubleOptInEnabled",
}

/**
 * update columns of table "Organization"
 */
export enum Organization_update_column {
  addressLine1 = "addressLine1",
  addressLine2 = "addressLine2",
  aliases = "aliases",
  apiKeyHash = "apiKeyHash",
  bankBic = "bankBic",
  bankIban = "bankIban",
  bankName = "bankName",
  city = "city",
  country = "country",
  created_at = "created_at",
  defaultTaxExemptionNote = "defaultTaxExemptionNote",
  defaultVatRate = "defaultVatRate",
  description = "description",
  email = "email",
  formbricksApiKey = "formbricksApiKey",
  formbricksApiUrl = "formbricksApiUrl",
  ghostNewsletterApiKeyConfigured = "ghostNewsletterApiKeyConfigured",
  ghostNewsletterApiKeyEncrypted = "ghostNewsletterApiKeyEncrypted",
  ghostNewsletterApiUrl = "ghostNewsletterApiUrl",
  ghostNewsletterDoubleOptInEnabled = "ghostNewsletterDoubleOptInEnabled",
  ghostNewsletterLabel = "ghostNewsletterLabel",
  ghostNewsletterListId = "ghostNewsletterListId",
  ghostNewsletterSlug = "ghostNewsletterSlug",
  id = "id",
  invoiceFooterText = "invoiceFooterText",
  invoiceNumberPrefix = "invoiceNumberPrefix",
  legalForm = "legalForm",
  legalName = "legalName",
  logo = "logo",
  managingDirector = "managingDirector",
  name = "name",
  newsletterDescription = "newsletterDescription",
  newsletterProvider = "newsletterProvider",
  phone = "phone",
  postalCode = "postalCode",
  registerCourt = "registerCourt",
  registerNumber = "registerNumber",
  stripePublishableKey = "stripePublishableKey",
  stripeSecretKey = "stripeSecretKey",
  stripeWebhookSecret = "stripeWebhookSecret",
  taxNumber = "taxNumber",
  type = "type",
  updated_at = "updated_at",
  vatId = "vatId",
  website = "website",
}

/**
 * unique or primary key constraints on table "ProgramType"
 */
export enum ProgramType_constraint {
  ProgramType_pkey = "ProgramType_pkey",
}

/**
 * update columns of table "ProgramType"
 */
export enum ProgramType_update_column {
  comment = "comment",
  defaultAttendanceCertificateTemplateId = "defaultAttendanceCertificateTemplateId",
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
  achievementCertificateTemplateURL = "achievementCertificateTemplateURL",
  achievementRecordUploadDeadline = "achievementRecordUploadDeadline",
  applicationStart = "applicationStart",
  attendanceCertificateTemplateId = "attendanceCertificateTemplateId",
  attendanceCertificateTemplateURL = "attendanceCertificateTemplateURL",
  closingQuestionnaire = "closingQuestionnaire",
  defaultApplicationEnd = "defaultApplicationEnd",
  defaultFormbricksEnrollmentSurveyUrl = "defaultFormbricksEnrollmentSurveyUrl",
  defaultMaxMissedSessions = "defaultMaxMissedSessions",
  defaultProjectSubmissionDeadline = "defaultProjectSubmissionDeadline",
  defaultProjectType = "defaultProjectType",
  id = "id",
  lectureEnd = "lectureEnd",
  lectureStart = "lectureStart",
  matrixInstructorRoomId = "matrixInstructorRoomId",
  matrixSpaceId = "matrixSpaceId",
  organizationId = "organizationId",
  projectProposalsEnabledByDefault = "projectProposalsEnabledByDefault",
  published = "published",
  shortTitle = "shortTitle",
  showExtendedApplicationPeriodBanner = "showExtendedApplicationPeriodBanner",
  speakerQuestionnaire = "speakerQuestionnaire",
  startQuestionnaire = "startQuestionnaire",
  title = "title",
  type = "type",
  visibility = "visibility",
}

/**
 * select "Program_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Program"
 */
export enum Program_select_column_Program_aggregate_bool_exp_bool_and_arguments_columns {
  projectProposalsEnabledByDefault = "projectProposalsEnabledByDefault",
  published = "published",
  showExtendedApplicationPeriodBanner = "showExtendedApplicationPeriodBanner",
  visibility = "visibility",
}

/**
 * select "Program_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Program"
 */
export enum Program_select_column_Program_aggregate_bool_exp_bool_or_arguments_columns {
  projectProposalsEnabledByDefault = "projectProposalsEnabledByDefault",
  published = "published",
  showExtendedApplicationPeriodBanner = "showExtendedApplicationPeriodBanner",
  visibility = "visibility",
}

/**
 * update columns of table "Program"
 */
export enum Program_update_column {
  achievementCertificateTemplateURL = "achievementCertificateTemplateURL",
  achievementRecordUploadDeadline = "achievementRecordUploadDeadline",
  applicationStart = "applicationStart",
  attendanceCertificateTemplateId = "attendanceCertificateTemplateId",
  attendanceCertificateTemplateURL = "attendanceCertificateTemplateURL",
  closingQuestionnaire = "closingQuestionnaire",
  defaultApplicationEnd = "defaultApplicationEnd",
  defaultFormbricksEnrollmentSurveyUrl = "defaultFormbricksEnrollmentSurveyUrl",
  defaultMaxMissedSessions = "defaultMaxMissedSessions",
  defaultProjectSubmissionDeadline = "defaultProjectSubmissionDeadline",
  defaultProjectType = "defaultProjectType",
  id = "id",
  lectureEnd = "lectureEnd",
  lectureStart = "lectureStart",
  matrixInstructorRoomId = "matrixInstructorRoomId",
  matrixSpaceId = "matrixSpaceId",
  organizationId = "organizationId",
  projectProposalsEnabledByDefault = "projectProposalsEnabledByDefault",
  published = "published",
  shortTitle = "shortTitle",
  showExtendedApplicationPeriodBanner = "showExtendedApplicationPeriodBanner",
  speakerQuestionnaire = "speakerQuestionnaire",
  startQuestionnaire = "startQuestionnaire",
  title = "title",
  type = "type",
  visibility = "visibility",
}

/**
 * unique or primary key constraints on table "ProjectAuthor"
 */
export enum ProjectAuthor_constraint {
  ProjectAuthor_pkey = "ProjectAuthor_pkey",
  ProjectAuthor_projectId_userId_key = "ProjectAuthor_projectId_userId_key",
}

/**
 * select columns of table "ProjectAuthor"
 */
export enum ProjectAuthor_select_column {
  created_at = "created_at",
  id = "id",
  participationStatus = "participationStatus",
  projectId = "projectId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "ProjectAuthor"
 */
export enum ProjectAuthor_update_column {
  created_at = "created_at",
  id = "id",
  participationStatus = "participationStatus",
  projectId = "projectId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "ProjectBadge"
 */
export enum ProjectBadge_constraint {
  ProjectBadge_pkey = "ProjectBadge_pkey",
  ProjectBadge_projectId_badgeId_key = "ProjectBadge_projectId_badgeId_key",
}

/**
 * select columns of table "ProjectBadge"
 */
export enum ProjectBadge_select_column {
  badgeId = "badgeId",
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * update columns of table "ProjectBadge"
 */
export enum ProjectBadge_update_column {
  badgeId = "badgeId",
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectConsentEvent"
 */
export enum ProjectConsentEvent_constraint {
  ProjectConsentEvent_pkey = "ProjectConsentEvent_pkey",
}

/**
 * select columns of table "ProjectConsentEvent"
 */
export enum ProjectConsentEvent_select_column {
  actorUserId = "actorUserId",
  created_at = "created_at",
  eventType = "eventType",
  id = "id",
  projectId = "projectId",
  termsVersion = "termsVersion",
}

/**
 * update columns of table "ProjectConsentEvent"
 */
export enum ProjectConsentEvent_update_column {
  actorUserId = "actorUserId",
  created_at = "created_at",
  eventType = "eventType",
  id = "id",
  projectId = "projectId",
  termsVersion = "termsVersion",
}

/**
 * unique or primary key constraints on table "ProjectCourse"
 */
export enum ProjectCourse_constraint {
  ProjectCourse_pkey = "ProjectCourse_pkey",
  ProjectCourse_projectId_courseId_key = "ProjectCourse_projectId_courseId_key",
}

/**
 * select columns of table "ProjectCourse"
 */
export enum ProjectCourse_select_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * update columns of table "ProjectCourse"
 */
export enum ProjectCourse_update_column {
  courseId = "courseId",
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectDocumentationInstruction"
 */
export enum ProjectDocumentationInstruction_constraint {
  ProjectDocumentationInstruction_one_default_per_type = "ProjectDocumentationInstruction_one_default_per_type",
  ProjectDocumentationInstruction_owner_title_key = "ProjectDocumentationInstruction_owner_title_key",
  ProjectDocumentationInstruction_pkey = "ProjectDocumentationInstruction_pkey",
  ProjectDocumentationInstruction_platform_title_key = "ProjectDocumentationInstruction_platform_title_key",
}

/**
 * select columns of table "ProjectDocumentationInstruction"
 */
export enum ProjectDocumentationInstruction_select_column {
  createdByUserId = "createdByUserId",
  created_at = "created_at",
  id = "id",
  isDefault = "isDefault",
  legacyAchievementDocumentationTemplateId = "legacyAchievementDocumentationTemplateId",
  projectTypeValue = "projectTypeValue",
  title = "title",
  updated_at = "updated_at",
  url = "url",
}

/**
 * select "ProjectDocumentationInstruction_aggregate_bool_exp_bool_and_arguments_columns" columns of table "ProjectDocumentationInstruction"
 */
export enum ProjectDocumentationInstruction_select_column_ProjectDocumentationInstruction_aggregate_bool_exp_bool_and_arguments_columns {
  isDefault = "isDefault",
}

/**
 * select "ProjectDocumentationInstruction_aggregate_bool_exp_bool_or_arguments_columns" columns of table "ProjectDocumentationInstruction"
 */
export enum ProjectDocumentationInstruction_select_column_ProjectDocumentationInstruction_aggregate_bool_exp_bool_or_arguments_columns {
  isDefault = "isDefault",
}

/**
 * update columns of table "ProjectDocumentationInstruction"
 */
export enum ProjectDocumentationInstruction_update_column {
  createdByUserId = "createdByUserId",
  created_at = "created_at",
  id = "id",
  isDefault = "isDefault",
  legacyAchievementDocumentationTemplateId = "legacyAchievementDocumentationTemplateId",
  projectTypeValue = "projectTypeValue",
  title = "title",
  updated_at = "updated_at",
  url = "url",
}

/**
 * unique or primary key constraints on table "ProjectGroupOption"
 */
export enum ProjectGroupOption_constraint {
  ProjectGroupOption_pkey = "ProjectGroupOption_pkey",
  ProjectGroupOption_title_key = "ProjectGroupOption_title_key",
}

/**
 * update columns of table "ProjectGroupOption"
 */
export enum ProjectGroupOption_update_column {
  created_at = "created_at",
  id = "id",
  order = "order",
  organizationId = "organizationId",
  title = "title",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectGroup"
 */
export enum ProjectGroup_constraint {
  ProjectGroup_pkey = "ProjectGroup_pkey",
  ProjectGroup_projectId_groupOptionId_key = "ProjectGroup_projectId_groupOptionId_key",
}

/**
 * select columns of table "ProjectGroup"
 */
export enum ProjectGroup_select_column {
  created_at = "created_at",
  groupOptionId = "groupOptionId",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * update columns of table "ProjectGroup"
 */
export enum ProjectGroup_update_column {
  created_at = "created_at",
  groupOptionId = "groupOptionId",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectMentor"
 */
export enum ProjectMentor_constraint {
  ProjectMentor_pkey = "ProjectMentor_pkey",
  ProjectMentor_projectId_userId_key = "ProjectMentor_projectId_userId_key",
}

/**
 * select columns of table "ProjectMentor"
 */
export enum ProjectMentor_select_column {
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "ProjectMentor"
 */
export enum ProjectMentor_update_column {
  created_at = "created_at",
  id = "id",
  projectId = "projectId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * unique or primary key constraints on table "ProjectParticipationStatus"
 */
export enum ProjectParticipationStatus_constraint {
  ProjectParticipationStatus_pkey = "ProjectParticipationStatus_pkey",
}

export enum ProjectParticipationStatus_enum {
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXCLUDED = "EXCLUDED",
  REQUESTED = "REQUESTED",
}

/**
 * update columns of table "ProjectParticipationStatus"
 */
export enum ProjectParticipationStatus_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "ProjectRating"
 */
export enum ProjectRating_constraint {
  ProjectRating_pkey = "ProjectRating_pkey",
}

export enum ProjectRating_enum {
  FAILED = "FAILED",
  PASSED = "PASSED",
  UNRATED = "UNRATED",
}

/**
 * update columns of table "ProjectRating"
 */
export enum ProjectRating_update_column {
  comment = "comment",
  value = "value",
}

/**
 * unique or primary key constraints on table "ProjectSliderCourseGroup"
 */
export enum ProjectSliderCourseGroup_constraint {
  ProjectSliderCourseGroup_pkey = "ProjectSliderCourseGroup_pkey",
  ProjectSliderCourseGroup_projectSliderOptionId_courseGroupO_key = "ProjectSliderCourseGroup_projectSliderOptionId_courseGroupO_key",
}

/**
 * select columns of table "ProjectSliderCourseGroup"
 */
export enum ProjectSliderCourseGroup_select_column {
  courseGroupOptionId = "courseGroupOptionId",
  created_at = "created_at",
  id = "id",
  projectSliderOptionId = "projectSliderOptionId",
  updated_at = "updated_at",
}

/**
 * update columns of table "ProjectSliderCourseGroup"
 */
export enum ProjectSliderCourseGroup_update_column {
  courseGroupOptionId = "courseGroupOptionId",
  created_at = "created_at",
  id = "id",
  projectSliderOptionId = "projectSliderOptionId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectSliderProjectGroup"
 */
export enum ProjectSliderProjectGroup_constraint {
  ProjectSliderProjectGroup_pkey = "ProjectSliderProjectGroup_pkey",
  ProjectSliderProjectGroup_projectSliderOptionId_projectGrou_key = "ProjectSliderProjectGroup_projectSliderOptionId_projectGrou_key",
}

/**
 * select columns of table "ProjectSliderProjectGroup"
 */
export enum ProjectSliderProjectGroup_select_column {
  created_at = "created_at",
  id = "id",
  projectGroupOptionId = "projectGroupOptionId",
  projectSliderOptionId = "projectSliderOptionId",
  updated_at = "updated_at",
}

/**
 * update columns of table "ProjectSliderProjectGroup"
 */
export enum ProjectSliderProjectGroup_update_column {
  created_at = "created_at",
  id = "id",
  projectGroupOptionId = "projectGroupOptionId",
  projectSliderOptionId = "projectSliderOptionId",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "ProjectStatus"
 */
export enum ProjectStatus_constraint {
  ProjectStatus_pkey = "ProjectStatus_pkey",
}

export enum ProjectStatus_enum {
  COMPLETED = "COMPLETED",
  INCOMPLETE = "INCOMPLETE",
  ONGOING = "ONGOING",
  PROPOSED = "PROPOSED",
  PUBLISHED = "PUBLISHED",
  SUBMITTED = "SUBMITTED",
}

/**
 * update columns of table "ProjectStatus"
 */
export enum ProjectStatus_update_column {
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
 * select columns of table "ProjectType"
 */
export enum ProjectType_select_column {
  certificateTemplateId = "certificateTemplateId",
  comment = "comment",
  requiresCoverImage = "requiresCoverImage",
  requiresDocumentation = "requiresDocumentation",
  requiresExternalUrl = "requiresExternalUrl",
  requiresPresentation = "requiresPresentation",
  value = "value",
}

/**
 * select "ProjectType_aggregate_bool_exp_bool_and_arguments_columns" columns of table "ProjectType"
 */
export enum ProjectType_select_column_ProjectType_aggregate_bool_exp_bool_and_arguments_columns {
  requiresCoverImage = "requiresCoverImage",
  requiresDocumentation = "requiresDocumentation",
  requiresExternalUrl = "requiresExternalUrl",
  requiresPresentation = "requiresPresentation",
}

/**
 * select "ProjectType_aggregate_bool_exp_bool_or_arguments_columns" columns of table "ProjectType"
 */
export enum ProjectType_select_column_ProjectType_aggregate_bool_exp_bool_or_arguments_columns {
  requiresCoverImage = "requiresCoverImage",
  requiresDocumentation = "requiresDocumentation",
  requiresExternalUrl = "requiresExternalUrl",
  requiresPresentation = "requiresPresentation",
}

/**
 * update columns of table "ProjectType"
 */
export enum ProjectType_update_column {
  certificateTemplateId = "certificateTemplateId",
  comment = "comment",
  requiresCoverImage = "requiresCoverImage",
  requiresDocumentation = "requiresDocumentation",
  requiresExternalUrl = "requiresExternalUrl",
  requiresPresentation = "requiresPresentation",
  value = "value",
}

/**
 * unique or primary key constraints on table "Project"
 */
export enum Project_constraint {
  Project_legacyAchievementOptionId_key = "Project_legacyAchievementOptionId_key",
  Project_legacyAchievementRecordId_key = "Project_legacyAchievementRecordId_key",
  Project_pkey = "Project_pkey",
}

/**
 * select columns of table "Project"
 */
export enum Project_select_column {
  acceptingParticipants = "acceptingParticipants",
  coverImageUrl = "coverImageUrl",
  created_at = "created_at",
  csvResults = "csvResults",
  description = "description",
  documentationInstructionId = "documentationInstructionId",
  documentationUrl = "documentationUrl",
  externalUrl = "externalUrl",
  id = "id",
  legacyAchievementOptionId = "legacyAchievementOptionId",
  legacyAchievementRecordId = "legacyAchievementRecordId",
  organizationId = "organizationId",
  parentProjectId = "parentProjectId",
  presentationUrl = "presentationUrl",
  projectReviewRequestedAt = "projectReviewRequestedAt",
  proposedByUserId = "proposedByUserId",
  published = "published",
  rating = "rating",
  ratingComment = "ratingComment",
  sentBackAt = "sentBackAt",
  status = "status",
  submissionDeadline = "submissionDeadline",
  submittedAt = "submittedAt",
  submittedBy = "submittedBy",
  suggestedForPublication = "suggestedForPublication",
  tagline = "tagline",
  title = "title",
  type = "type",
  updated_at = "updated_at",
}

/**
 * select "Project_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Project"
 */
export enum Project_select_column_Project_aggregate_bool_exp_bool_and_arguments_columns {
  acceptingParticipants = "acceptingParticipants",
  published = "published",
  suggestedForPublication = "suggestedForPublication",
}

/**
 * select "Project_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Project"
 */
export enum Project_select_column_Project_aggregate_bool_exp_bool_or_arguments_columns {
  acceptingParticipants = "acceptingParticipants",
  published = "published",
  suggestedForPublication = "suggestedForPublication",
}

/**
 * update columns of table "Project"
 */
export enum Project_update_column {
  acceptingParticipants = "acceptingParticipants",
  coverImageUrl = "coverImageUrl",
  created_at = "created_at",
  csvResults = "csvResults",
  description = "description",
  documentationInstructionId = "documentationInstructionId",
  documentationUrl = "documentationUrl",
  externalUrl = "externalUrl",
  id = "id",
  legacyAchievementOptionId = "legacyAchievementOptionId",
  legacyAchievementRecordId = "legacyAchievementRecordId",
  organizationId = "organizationId",
  parentProjectId = "parentProjectId",
  presentationUrl = "presentationUrl",
  projectReviewRequestedAt = "projectReviewRequestedAt",
  proposedByUserId = "proposedByUserId",
  published = "published",
  rating = "rating",
  ratingComment = "ratingComment",
  sentBackAt = "sentBackAt",
  status = "status",
  submissionDeadline = "submissionDeadline",
  submittedAt = "submittedAt",
  submittedBy = "submittedBy",
  suggestedForPublication = "suggestedForPublication",
  tagline = "tagline",
  title = "title",
  type = "type",
  updated_at = "updated_at",
}

/**
 * unique or primary key constraints on table "SavedJobPosting"
 */
export enum SavedJobPosting_constraint {
  SavedJobPosting_pkey = "SavedJobPosting_pkey",
  SavedJobPosting_userId_jobPostingId_key = "SavedJobPosting_userId_jobPostingId_key",
}

/**
 * select columns of table "SavedJobPosting"
 */
export enum SavedJobPosting_select_column {
  created_at = "created_at",
  id = "id",
  jobPostingId = "jobPostingId",
  updated_at = "updated_at",
  userId = "userId",
}

/**
 * update columns of table "SavedJobPosting"
 */
export enum SavedJobPosting_update_column {
  created_at = "created_at",
  id = "id",
  jobPostingId = "jobPostingId",
  updated_at = "updated_at",
  userId = "userId",
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
  GUEST = "GUEST",
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
  User_email_non_guest_key = "User_email_non_guest_key",
  User_pkey = "User_pkey",
}

/**
 * select columns of table "User"
 */
export enum User_select_column {
  addressLine1 = "addressLine1",
  addressLine2 = "addressLine2",
  anonymousId = "anonymousId",
  city = "city",
  country = "country",
  created_at = "created_at",
  email = "email",
  externalProfile = "externalProfile",
  firstName = "firstName",
  id = "id",
  integerId = "integerId",
  lastName = "lastName",
  matriculationNumber = "matriculationNumber",
  matrixUserHandle = "matrixUserHandle",
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
  addressLine1 = "addressLine1",
  addressLine2 = "addressLine2",
  anonymousId = "anonymousId",
  city = "city",
  country = "country",
  created_at = "created_at",
  email = "email",
  externalProfile = "externalProfile",
  firstName = "firstName",
  id = "id",
  integerId = "integerId",
  lastName = "lastName",
  matriculationNumber = "matriculationNumber",
  matrixUserHandle = "matrixUserHandle",
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
 * input type for inserting array relation for remote table "AchievementOption"
 */
export interface AchievementOption_arr_rel_insert_input {
  data: AchievementOption_insert_input[];
  on_conflict?: AchievementOption_on_conflict | null;
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
  description?: String_comparison_exp | null;
  evaluationScriptUrl?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
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
  AchievementOptionTemplate?: AchievementDocumentationTemplate_obj_rel_insert_input | null;
  AchievementRecordType?: AchievementRecordType_obj_rel_insert_input | null;
  AchievementRecords?: AchievementRecord_arr_rel_insert_input | null;
  achievementDocumentationTemplateId?: number | null;
  created_at?: any | null;
  description?: string | null;
  evaluationScriptUrl?: string | null;
  id?: number | null;
  published?: boolean | null;
  recordType?: AchievementRecordType_enum | null;
  title?: string | null;
  updated_at?: any | null;
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
 * input type for inserting array relation for remote table "AchievementRecord"
 */
export interface AchievementRecord_arr_rel_insert_input {
  data: AchievementRecord_insert_input[];
  on_conflict?: AchievementRecord_on_conflict | null;
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

export interface AddonMappingInput {
  choiceId: string;
  confidence: string;
  currency: string;
  description: string;
  extractedPrice: number;
  questionId: string;
  questionTextDe?: string | null;
  questionTextEn?: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  validatedPrice: number;
}

/**
 * Boolean expression to filter rows from the table "AppSettings". All fields are combined with a logical 'AND'.
 */
export interface AppSettings_bool_exp {
  _and?: AppSettings_bool_exp[] | null;
  _not?: AppSettings_bool_exp | null;
  _or?: AppSettings_bool_exp[] | null;
  appName?: String_comparison_exp | null;
  backgroundImageURL?: String_comparison_exp | null;
  bannerBackgroundColor?: String_comparison_exp | null;
  bannerFontColor?: String_comparison_exp | null;
  bannerTextDe?: String_comparison_exp | null;
  bannerTextEn?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  defaultLocale?: String_comparison_exp | null;
  domain?: String_comparison_exp | null;
  faqCollectionName?: String_comparison_exp | null;
  faviconUrl?: String_comparison_exp | null;
  guestDataRetentionMonths?: Int_comparison_exp | null;
  imprintUrl?: String_comparison_exp | null;
  logoUrl?: String_comparison_exp | null;
  previewImageURL?: String_comparison_exp | null;
  primaryColor?: String_comparison_exp | null;
  privacyUrl?: String_comparison_exp | null;
  secondaryColor?: String_comparison_exp | null;
  showFaqSection?: Boolean_comparison_exp | null;
  timeZone?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "AppSettings"
 */
export interface AppSettings_insert_input {
  appName?: string | null;
  backgroundImageURL?: string | null;
  bannerBackgroundColor?: string | null;
  bannerFontColor?: string | null;
  bannerTextDe?: string | null;
  bannerTextEn?: string | null;
  created_at?: any | null;
  defaultLocale?: string | null;
  domain?: string | null;
  faqCollectionName?: string | null;
  faviconUrl?: string | null;
  guestDataRetentionMonths?: number | null;
  imprintUrl?: string | null;
  logoUrl?: string | null;
  previewImageURL?: string | null;
  primaryColor?: string | null;
  privacyUrl?: string | null;
  secondaryColor?: string | null;
  showFaqSection?: boolean | null;
  timeZone?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "AppSettings"
 */
export interface AppSettings_obj_rel_insert_input {
  data: AppSettings_insert_input;
  on_conflict?: AppSettings_on_conflict | null;
}

/**
 * on_conflict condition type for table "AppSettings"
 */
export interface AppSettings_on_conflict {
  constraint: AppSettings_constraint;
  update_columns: AppSettings_update_column[];
  where?: AppSettings_bool_exp | null;
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
  matchType?: String_comparison_exp | null;
  recordedIdentifier?: String_comparison_exp | null;
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
  matchType?: string | null;
  recordedIdentifier?: string | null;
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
  matchType?: order_by | null;
  recordedIdentifier?: order_by | null;
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
  matchType?: order_by | null;
  recordedIdentifier?: order_by | null;
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
  matchType?: string | null;
  recordedIdentifier?: string | null;
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
 * Boolean expression to filter rows from the table "Badge". All fields are combined with a logical 'AND'.
 */
export interface Badge_bool_exp {
  ProjectBadges?: ProjectBadge_bool_exp | null;
  ProjectBadges_aggregate?: ProjectBadge_aggregate_bool_exp | null;
  _and?: Badge_bool_exp[] | null;
  _not?: Badge_bool_exp | null;
  _or?: Badge_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  description?: String_comparison_exp | null;
  icon?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Badge"
 */
export interface Badge_insert_input {
  ProjectBadges?: ProjectBadge_arr_rel_insert_input | null;
  created_at?: any | null;
  description?: string | null;
  icon?: string | null;
  id?: number | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "Badge"
 */
export interface Badge_obj_rel_insert_input {
  data: Badge_insert_input;
  on_conflict?: Badge_on_conflict | null;
}

/**
 * on_conflict condition type for table "Badge"
 */
export interface Badge_on_conflict {
  constraint: Badge_constraint;
  update_columns: Badge_update_column[];
  where?: Badge_bool_exp | null;
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
 * Boolean expression to filter rows from the table "CertificateTemplate". All fields are combined with a logical 'AND'.
 */
export interface CertificateTemplate_bool_exp {
  AchievementCourses?: Course_bool_exp | null;
  AchievementCourses_aggregate?: Course_aggregate_bool_exp | null;
  AttendanceCourses?: Course_bool_exp | null;
  AttendanceCourses_aggregate?: Course_aggregate_bool_exp | null;
  AttendancePrograms?: Program_bool_exp | null;
  AttendancePrograms_aggregate?: Program_aggregate_bool_exp | null;
  ProjectTypes?: ProjectType_bool_exp | null;
  ProjectTypes_aggregate?: ProjectType_aggregate_bool_exp | null;
  _and?: CertificateTemplate_bool_exp[] | null;
  _not?: CertificateTemplate_bool_exp | null;
  _or?: CertificateTemplate_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  html?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  name?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CertificateTemplate"
 */
export interface CertificateTemplate_insert_input {
  AchievementCourses?: Course_arr_rel_insert_input | null;
  AttendanceCourses?: Course_arr_rel_insert_input | null;
  AttendancePrograms?: Program_arr_rel_insert_input | null;
  ProjectTypes?: ProjectType_arr_rel_insert_input | null;
  created_at?: any | null;
  html?: string | null;
  id?: number | null;
  name?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "CertificateTemplate"
 */
export interface CertificateTemplate_obj_rel_insert_input {
  data: CertificateTemplate_insert_input;
  on_conflict?: CertificateTemplate_on_conflict | null;
}

/**
 * on_conflict condition type for table "CertificateTemplate"
 */
export interface CertificateTemplate_on_conflict {
  constraint: CertificateTemplate_constraint;
  update_columns: CertificateTemplate_update_column[];
  where?: CertificateTemplate_bool_exp | null;
}

/**
 * Ordering options when selecting data from "CertificateTemplate".
 */
export interface CertificateTemplate_order_by {
  AchievementCourses_aggregate?: Course_aggregate_order_by | null;
  AttendanceCourses_aggregate?: Course_aggregate_order_by | null;
  AttendancePrograms_aggregate?: Program_aggregate_order_by | null;
  ProjectTypes_aggregate?: ProjectType_aggregate_order_by | null;
  created_at?: order_by | null;
  html?: order_by | null;
  id?: order_by | null;
  name?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Country". All fields are combined with a logical 'AND'.
 */
export interface Country_bool_exp {
  Organizations?: Organization_bool_exp | null;
  Organizations_aggregate?: Organization_aggregate_bool_exp | null;
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
  Organizations?: Organization_arr_rel_insert_input | null;
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
  Organizations_aggregate?: Organization_aggregate_order_by | null;
  Users_aggregate?: User_aggregate_order_by | null;
  code?: order_by | null;
  name_de?: order_by | null;
  name_en?: order_by | null;
}

export interface CourseAddonMapping_aggregate_bool_exp {
  count?: CourseAddonMapping_aggregate_bool_exp_count | null;
}

export interface CourseAddonMapping_aggregate_bool_exp_count {
  arguments?: CourseAddonMapping_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseAddonMapping_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_aggregate_order_by {
  avg?: CourseAddonMapping_avg_order_by | null;
  count?: order_by | null;
  max?: CourseAddonMapping_max_order_by | null;
  min?: CourseAddonMapping_min_order_by | null;
  stddev?: CourseAddonMapping_stddev_order_by | null;
  stddev_pop?: CourseAddonMapping_stddev_pop_order_by | null;
  stddev_samp?: CourseAddonMapping_stddev_samp_order_by | null;
  sum?: CourseAddonMapping_sum_order_by | null;
  var_pop?: CourseAddonMapping_var_pop_order_by | null;
  var_samp?: CourseAddonMapping_var_samp_order_by | null;
  variance?: CourseAddonMapping_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseAddonMapping"
 */
export interface CourseAddonMapping_arr_rel_insert_input {
  data: CourseAddonMapping_insert_input[];
  on_conflict?: CourseAddonMapping_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_avg_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseAddonMapping". All fields are combined with a logical 'AND'.
 */
export interface CourseAddonMapping_bool_exp {
  Course?: Course_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: CourseAddonMapping_bool_exp[] | null;
  _not?: CourseAddonMapping_bool_exp | null;
  _or?: CourseAddonMapping_bool_exp[] | null;
  choiceId?: String_comparison_exp | null;
  confidence?: String_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  currency?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  extractedPrice?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  questionId?: String_comparison_exp | null;
  questionTextDe?: String_comparison_exp | null;
  questionTextEn?: String_comparison_exp | null;
  stripePriceId?: String_comparison_exp | null;
  stripeProductId?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  validatedAt?: timestamptz_comparison_exp | null;
  validatedBy?: uuid_comparison_exp | null;
  validatedPrice?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseAddonMapping"
 */
export interface CourseAddonMapping_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  choiceId?: string | null;
  confidence?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  currency?: string | null;
  description?: string | null;
  extractedPrice?: number | null;
  id?: number | null;
  questionId?: string | null;
  questionTextDe?: string | null;
  questionTextEn?: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  updated_at?: any | null;
  validatedAt?: any | null;
  validatedBy?: any | null;
  validatedPrice?: number | null;
}

/**
 * order by max() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_max_order_by {
  choiceId?: order_by | null;
  confidence?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  description?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  questionId?: order_by | null;
  questionTextDe?: order_by | null;
  questionTextEn?: order_by | null;
  stripePriceId?: order_by | null;
  stripeProductId?: order_by | null;
  updated_at?: order_by | null;
  validatedAt?: order_by | null;
  validatedBy?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by min() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_min_order_by {
  choiceId?: order_by | null;
  confidence?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  description?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  questionId?: order_by | null;
  questionTextDe?: order_by | null;
  questionTextEn?: order_by | null;
  stripePriceId?: order_by | null;
  stripeProductId?: order_by | null;
  updated_at?: order_by | null;
  validatedAt?: order_by | null;
  validatedBy?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "CourseAddonMapping"
 */
export interface CourseAddonMapping_obj_rel_insert_input {
  data: CourseAddonMapping_insert_input;
  on_conflict?: CourseAddonMapping_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseAddonMapping"
 */
export interface CourseAddonMapping_on_conflict {
  constraint: CourseAddonMapping_constraint;
  update_columns: CourseAddonMapping_update_column[];
  where?: CourseAddonMapping_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_stddev_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_stddev_pop_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_stddev_samp_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_sum_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_var_pop_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_var_samp_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseAddonMapping"
 */
export interface CourseAddonMapping_variance_order_by {
  courseId?: order_by | null;
  extractedPrice?: order_by | null;
  id?: order_by | null;
  validatedPrice?: order_by | null;
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

export interface CourseEnrollmentAddon_aggregate_bool_exp {
  count?: CourseEnrollmentAddon_aggregate_bool_exp_count | null;
}

export interface CourseEnrollmentAddon_aggregate_bool_exp_count {
  arguments?: CourseEnrollmentAddon_select_column[] | null;
  distinct?: boolean | null;
  filter?: CourseEnrollmentAddon_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_aggregate_order_by {
  avg?: CourseEnrollmentAddon_avg_order_by | null;
  count?: order_by | null;
  max?: CourseEnrollmentAddon_max_order_by | null;
  min?: CourseEnrollmentAddon_min_order_by | null;
  stddev?: CourseEnrollmentAddon_stddev_order_by | null;
  stddev_pop?: CourseEnrollmentAddon_stddev_pop_order_by | null;
  stddev_samp?: CourseEnrollmentAddon_stddev_samp_order_by | null;
  sum?: CourseEnrollmentAddon_sum_order_by | null;
  var_pop?: CourseEnrollmentAddon_var_pop_order_by | null;
  var_samp?: CourseEnrollmentAddon_var_samp_order_by | null;
  variance?: CourseEnrollmentAddon_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_arr_rel_insert_input {
  data: CourseEnrollmentAddon_insert_input[];
  on_conflict?: CourseEnrollmentAddon_on_conflict | null;
}

/**
 * order by avg() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_avg_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollmentAddon". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollmentAddon_bool_exp {
  CourseAddonMapping?: CourseAddonMapping_bool_exp | null;
  CourseEnrollment?: CourseEnrollment_bool_exp | null;
  _and?: CourseEnrollmentAddon_bool_exp[] | null;
  _not?: CourseEnrollmentAddon_bool_exp | null;
  _or?: CourseEnrollmentAddon_bool_exp[] | null;
  addonMappingId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  currency?: String_comparison_exp | null;
  enrollmentId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  priceAtPurchase?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_insert_input {
  CourseAddonMapping?: CourseAddonMapping_obj_rel_insert_input | null;
  CourseEnrollment?: CourseEnrollment_obj_rel_insert_input | null;
  addonMappingId?: number | null;
  created_at?: any | null;
  currency?: string | null;
  enrollmentId?: number | null;
  id?: number | null;
  priceAtPurchase?: number | null;
}

/**
 * order by max() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_max_order_by {
  addonMappingId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by min() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_min_order_by {
  addonMappingId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * on_conflict condition type for table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_on_conflict {
  constraint: CourseEnrollmentAddon_constraint;
  update_columns: CourseEnrollmentAddon_update_column[];
  where?: CourseEnrollmentAddon_bool_exp | null;
}

/**
 * order by stddev() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_stddev_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_stddev_pop_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_stddev_samp_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_sum_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_var_pop_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_var_samp_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseEnrollmentAddon"
 */
export interface CourseEnrollmentAddon_variance_order_by {
  addonMappingId?: order_by | null;
  enrollmentId?: order_by | null;
  id?: order_by | null;
  priceAtPurchase?: order_by | null;
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
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "CourseEnrollment". All fields are combined with a logical 'AND'.
 */
export interface CourseEnrollment_bool_exp {
  BillingOrganization?: Organization_bool_exp | null;
  Course?: Course_bool_exp | null;
  CourseEnrollmentAddons?: CourseEnrollmentAddon_bool_exp | null;
  CourseEnrollmentAddons_aggregate?: CourseEnrollmentAddon_aggregate_bool_exp | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_bool_exp | null;
  DegreeParticipationStats?: DegreeParticipationStats_bool_exp | null;
  Invoices?: Invoice_bool_exp | null;
  Invoices_aggregate?: Invoice_aggregate_bool_exp | null;
  LocationOption?: LocationOption_bool_exp | null;
  MotivationRating?: MotivationRating_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: CourseEnrollment_bool_exp[] | null;
  _not?: CourseEnrollment_bool_exp | null;
  _or?: CourseEnrollment_bool_exp[] | null;
  achievementCertificateURL?: String_comparison_exp | null;
  attendanceCertificateURL?: String_comparison_exp | null;
  billingOrganizationId?: Int_comparison_exp | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  invitationExpirationDate?: date_comparison_exp | null;
  location?: LocationOption_enum_comparison_exp | null;
  motivationLetter?: String_comparison_exp | null;
  motivationRating?: MotivationRating_enum_comparison_exp | null;
  status?: CourseEnrollmentStatus_enum_comparison_exp | null;
  termsAcceptedAt?: timestamptz_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseEnrollment"
 */
export interface CourseEnrollment_insert_input {
  BillingOrganization?: Organization_obj_rel_insert_input | null;
  Course?: Course_obj_rel_insert_input | null;
  CourseEnrollmentAddons?: CourseEnrollmentAddon_arr_rel_insert_input | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_obj_rel_insert_input | null;
  DegreeParticipationStats?: DegreeParticipationStats_obj_rel_insert_input | null;
  Invoices?: Invoice_arr_rel_insert_input | null;
  LocationOption?: LocationOption_obj_rel_insert_input | null;
  MotivationRating?: MotivationRating_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  achievementCertificateURL?: string | null;
  attendanceCertificateURL?: string | null;
  billingOrganizationId?: number | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  invitationExpirationDate?: any | null;
  location?: LocationOption_enum | null;
  motivationLetter?: string | null;
  motivationRating?: MotivationRating_enum | null;
  status?: CourseEnrollmentStatus_enum | null;
  termsAcceptedAt?: any | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_max_order_by {
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  motivationLetter?: order_by | null;
  termsAcceptedAt?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_min_order_by {
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  motivationLetter?: order_by | null;
  termsAcceptedAt?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
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
 * Ordering options when selecting data from "CourseEnrollment".
 */
export interface CourseEnrollment_order_by {
  BillingOrganization?: Organization_order_by | null;
  Course?: Course_order_by | null;
  CourseEnrollmentAddons_aggregate?: CourseEnrollmentAddon_aggregate_order_by | null;
  CourseEnrollmentStatus?: CourseEnrollmentStatus_order_by | null;
  DegreeParticipationStats?: DegreeParticipationStats_order_by | null;
  Invoices_aggregate?: Invoice_aggregate_order_by | null;
  LocationOption?: LocationOption_order_by | null;
  MotivationRating?: MotivationRating_order_by | null;
  User?: User_order_by | null;
  achievementCertificateURL?: order_by | null;
  attendanceCertificateURL?: order_by | null;
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  invitationExpirationDate?: order_by | null;
  location?: order_by | null;
  motivationLetter?: order_by | null;
  motivationRating?: order_by | null;
  status?: order_by | null;
  termsAcceptedAt?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by stddev() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_pop_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_stddev_samp_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_sum_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_var_pop_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_var_samp_order_by {
  billingOrganizationId?: order_by | null;
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "CourseEnrollment"
 */
export interface CourseEnrollment_variance_order_by {
  billingOrganizationId?: order_by | null;
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
  Organization?: Organization_bool_exp | null;
  ProgramType?: ProgramType_bool_exp | null;
  SelectedCourseGroups?: ProjectSliderCourseGroup_bool_exp | null;
  SelectedCourseGroups_aggregate?: ProjectSliderCourseGroup_aggregate_bool_exp | null;
  SelectedJobTypes?: JobSliderJobType_bool_exp | null;
  SelectedJobTypes_aggregate?: JobSliderJobType_aggregate_bool_exp | null;
  SelectedProjectGroups?: ProjectSliderProjectGroup_bool_exp | null;
  SelectedProjectGroups_aggregate?: ProjectSliderProjectGroup_aggregate_bool_exp | null;
  _and?: CourseGroupOption_bool_exp[] | null;
  _not?: CourseGroupOption_bool_exp | null;
  _or?: CourseGroupOption_bool_exp[] | null;
  contentType?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  order?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  programType?: String_comparison_exp | null;
  sliderGroup?: Boolean_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseGroupOption"
 */
export interface CourseGroupOption_insert_input {
  CourseGroups?: CourseGroup_arr_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  ProgramType?: ProgramType_obj_rel_insert_input | null;
  SelectedCourseGroups?: ProjectSliderCourseGroup_arr_rel_insert_input | null;
  SelectedJobTypes?: JobSliderJobType_arr_rel_insert_input | null;
  SelectedProjectGroups?: ProjectSliderProjectGroup_arr_rel_insert_input | null;
  contentType?: string | null;
  created_at?: any | null;
  id?: number | null;
  order?: number | null;
  organizationId?: number | null;
  programType?: string | null;
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

export interface CourseInput {
  basePrice?: number | null;
  currency?: string | null;
  id: number;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  title: string;
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
 * Boolean expression to filter rows from the table "CourseSeries". All fields are combined with a logical 'AND'.
 */
export interface CourseSeries_bool_exp {
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  _and?: CourseSeries_bool_exp[] | null;
  _not?: CourseSeries_bool_exp | null;
  _or?: CourseSeries_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "CourseSeries"
 */
export interface CourseSeries_insert_input {
  Courses?: Course_arr_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  organizationId?: number | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "CourseSeries"
 */
export interface CourseSeries_obj_rel_insert_input {
  data: CourseSeries_insert_input;
  on_conflict?: CourseSeries_on_conflict | null;
}

/**
 * on_conflict condition type for table "CourseSeries"
 */
export interface CourseSeries_on_conflict {
  constraint: CourseSeries_constraint;
  update_columns: CourseSeries_update_column[];
  where?: CourseSeries_bool_exp | null;
}

/**
 * Ordering options when selecting data from "CourseSeries".
 */
export interface CourseSeries_order_by {
  Courses_aggregate?: Course_aggregate_order_by | null;
  Organization?: Organization_order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
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
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Course". All fields are combined with a logical 'AND'.
 */
export interface Course_bool_exp {
  AchievementCertificateTemplate?: CertificateTemplate_bool_exp | null;
  AchievementOptionCourses?: AchievementOptionCourse_bool_exp | null;
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_bool_exp | null;
  AttendanceCertificateTemplate?: CertificateTemplate_bool_exp | null;
  CourseAddonMappings?: CourseAddonMapping_bool_exp | null;
  CourseAddonMappings_aggregate?: CourseAddonMapping_aggregate_bool_exp | null;
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
  CourseSeries?: CourseSeries_bool_exp | null;
  CourseStatus?: CourseStatus_bool_exp | null;
  DegreeCourses?: CourseDegree_bool_exp | null;
  DegreeCourses_aggregate?: CourseDegree_aggregate_bool_exp | null;
  Language?: Language_bool_exp | null;
  Program?: Program_bool_exp | null;
  ProjectCourses?: ProjectCourse_bool_exp | null;
  ProjectCourses_aggregate?: ProjectCourse_aggregate_bool_exp | null;
  Sessions?: Session_bool_exp | null;
  Sessions_aggregate?: Session_aggregate_bool_exp | null;
  Weekday?: Weekday_bool_exp | null;
  _and?: Course_bool_exp[] | null;
  _not?: Course_bool_exp | null;
  _or?: Course_bool_exp[] | null;
  achievementCertificatePossible?: Boolean_comparison_exp | null;
  achievementCertificateTemplateId?: Int_comparison_exp | null;
  activeParticipantCount?: bigint_comparison_exp | null;
  applicationEnd?: date_comparison_exp | null;
  attendanceCertificatePossible?: Boolean_comparison_exp | null;
  attendanceCertificateTemplateId?: Int_comparison_exp | null;
  basePrice?: Int_comparison_exp | null;
  chatLink?: String_comparison_exp | null;
  contentDescriptionField1?: String_comparison_exp | null;
  contentDescriptionField2?: String_comparison_exp | null;
  cost?: String_comparison_exp | null;
  courseSeriesId?: Int_comparison_exp | null;
  coverImage?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  currency?: String_comparison_exp | null;
  ects?: String_comparison_exp | null;
  endTime?: time_comparison_exp | null;
  externalRegistrationLink?: String_comparison_exp | null;
  formbricksEnrollmentSurveyUrl?: String_comparison_exp | null;
  guestRegistrationEnabled?: Boolean_comparison_exp | null;
  headingDescriptionField1?: String_comparison_exp | null;
  headingDescriptionField2?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  language?: String_comparison_exp | null;
  learningGoals?: String_comparison_exp | null;
  matrixRoomId?: String_comparison_exp | null;
  maxMissedSessions?: Int_comparison_exp | null;
  maxParticipants?: Int_comparison_exp | null;
  programId?: Int_comparison_exp | null;
  projectProposalsEnabled?: Boolean_comparison_exp | null;
  projectSubmissionDeadline?: timestamptz_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  registrationType?: CourseRegistrationType_enum_comparison_exp | null;
  requiredEcts?: numeric_comparison_exp | null;
  requiredEventCount?: Int_comparison_exp | null;
  startTime?: time_comparison_exp | null;
  status?: CourseStatus_enum_comparison_exp | null;
  stripePriceId?: String_comparison_exp | null;
  stripeProductId?: String_comparison_exp | null;
  tagline?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  weekDay?: Weekday_enum_comparison_exp | null;
}

/**
 * input type for inserting data into table "Course"
 */
export interface Course_insert_input {
  AchievementCertificateTemplate?: CertificateTemplate_obj_rel_insert_input | null;
  AchievementOptionCourses?: AchievementOptionCourse_arr_rel_insert_input | null;
  AttendanceCertificateTemplate?: CertificateTemplate_obj_rel_insert_input | null;
  CourseAddonMappings?: CourseAddonMapping_arr_rel_insert_input | null;
  CourseDegrees?: CourseDegree_arr_rel_insert_input | null;
  CourseEnrollments?: CourseEnrollment_arr_rel_insert_input | null;
  CourseFundingOrganizations?: CourseFundingOrganization_arr_rel_insert_input | null;
  CourseGroups?: CourseGroup_arr_rel_insert_input | null;
  CourseInstructors?: CourseInstructor_arr_rel_insert_input | null;
  CourseLocations?: CourseLocation_arr_rel_insert_input | null;
  CourseRegistrationType?: CourseRegistrationType_obj_rel_insert_input | null;
  CourseSeries?: CourseSeries_obj_rel_insert_input | null;
  CourseStatus?: CourseStatus_obj_rel_insert_input | null;
  DegreeCourses?: CourseDegree_arr_rel_insert_input | null;
  Language?: Language_obj_rel_insert_input | null;
  Program?: Program_obj_rel_insert_input | null;
  ProjectCourses?: ProjectCourse_arr_rel_insert_input | null;
  Sessions?: Session_arr_rel_insert_input | null;
  Weekday?: Weekday_obj_rel_insert_input | null;
  achievementCertificatePossible?: boolean | null;
  achievementCertificateTemplateId?: number | null;
  applicationEnd?: any | null;
  attendanceCertificatePossible?: boolean | null;
  attendanceCertificateTemplateId?: number | null;
  basePrice?: number | null;
  chatLink?: string | null;
  contentDescriptionField1?: string | null;
  contentDescriptionField2?: string | null;
  cost?: string | null;
  courseSeriesId?: number | null;
  coverImage?: string | null;
  created_at?: any | null;
  currency?: string | null;
  ects?: string | null;
  endTime?: any | null;
  externalRegistrationLink?: string | null;
  formbricksEnrollmentSurveyUrl?: string | null;
  guestRegistrationEnabled?: boolean | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  matrixRoomId?: string | null;
  maxMissedSessions?: number | null;
  maxParticipants?: number | null;
  programId?: number | null;
  projectProposalsEnabled?: boolean | null;
  projectSubmissionDeadline?: any | null;
  published?: boolean | null;
  registrationType?: CourseRegistrationType_enum | null;
  requiredEcts?: any | null;
  requiredEventCount?: number | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  tagline?: string | null;
  title?: string | null;
  updated_at?: any | null;
  weekDay?: Weekday_enum | null;
}

/**
 * order by max() on columns of table "Course"
 */
export interface Course_max_order_by {
  achievementCertificateTemplateId?: order_by | null;
  applicationEnd?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  courseSeriesId?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  ects?: order_by | null;
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  matrixRoomId?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  projectSubmissionDeadline?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
  stripePriceId?: order_by | null;
  stripeProductId?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "Course"
 */
export interface Course_min_order_by {
  achievementCertificateTemplateId?: order_by | null;
  applicationEnd?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  courseSeriesId?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  ects?: order_by | null;
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  matrixRoomId?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  projectSubmissionDeadline?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
  stripePriceId?: order_by | null;
  stripeProductId?: order_by | null;
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
  AchievementCertificateTemplate?: CertificateTemplate_order_by | null;
  AchievementOptionCourses_aggregate?: AchievementOptionCourse_aggregate_order_by | null;
  AttendanceCertificateTemplate?: CertificateTemplate_order_by | null;
  CourseAddonMappings_aggregate?: CourseAddonMapping_aggregate_order_by | null;
  CourseDegrees_aggregate?: CourseDegree_aggregate_order_by | null;
  CourseEnrollments_aggregate?: CourseEnrollment_aggregate_order_by | null;
  CourseFundingOrganizations_aggregate?: CourseFundingOrganization_aggregate_order_by | null;
  CourseGroups_aggregate?: CourseGroup_aggregate_order_by | null;
  CourseInstructors_aggregate?: CourseInstructor_aggregate_order_by | null;
  CourseLocations_aggregate?: CourseLocation_aggregate_order_by | null;
  CourseRegistrationType?: CourseRegistrationType_order_by | null;
  CourseSeries?: CourseSeries_order_by | null;
  CourseStatus?: CourseStatus_order_by | null;
  DegreeCourses_aggregate?: CourseDegree_aggregate_order_by | null;
  Language?: Language_order_by | null;
  Program?: Program_order_by | null;
  ProjectCourses_aggregate?: ProjectCourse_aggregate_order_by | null;
  Sessions_aggregate?: Session_aggregate_order_by | null;
  Weekday?: Weekday_order_by | null;
  achievementCertificatePossible?: order_by | null;
  achievementCertificateTemplateId?: order_by | null;
  activeParticipantCount?: order_by | null;
  applicationEnd?: order_by | null;
  attendanceCertificatePossible?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  chatLink?: order_by | null;
  contentDescriptionField1?: order_by | null;
  contentDescriptionField2?: order_by | null;
  cost?: order_by | null;
  courseSeriesId?: order_by | null;
  coverImage?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  ects?: order_by | null;
  endTime?: order_by | null;
  externalRegistrationLink?: order_by | null;
  formbricksEnrollmentSurveyUrl?: order_by | null;
  guestRegistrationEnabled?: order_by | null;
  headingDescriptionField1?: order_by | null;
  headingDescriptionField2?: order_by | null;
  id?: order_by | null;
  language?: order_by | null;
  learningGoals?: order_by | null;
  matrixRoomId?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  projectProposalsEnabled?: order_by | null;
  projectSubmissionDeadline?: order_by | null;
  published?: order_by | null;
  registrationType?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
  startTime?: order_by | null;
  status?: order_by | null;
  stripePriceId?: order_by | null;
  stripeProductId?: order_by | null;
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
  achievementCertificateTemplateId?: number | null;
  applicationEnd?: any | null;
  attendanceCertificatePossible?: boolean | null;
  attendanceCertificateTemplateId?: number | null;
  basePrice?: number | null;
  chatLink?: string | null;
  contentDescriptionField1?: string | null;
  contentDescriptionField2?: string | null;
  cost?: string | null;
  courseSeriesId?: number | null;
  coverImage?: string | null;
  created_at?: any | null;
  currency?: string | null;
  ects?: string | null;
  endTime?: any | null;
  externalRegistrationLink?: string | null;
  formbricksEnrollmentSurveyUrl?: string | null;
  guestRegistrationEnabled?: boolean | null;
  headingDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  id?: number | null;
  language?: string | null;
  learningGoals?: string | null;
  matrixRoomId?: string | null;
  maxMissedSessions?: number | null;
  maxParticipants?: number | null;
  programId?: number | null;
  projectProposalsEnabled?: boolean | null;
  projectSubmissionDeadline?: any | null;
  published?: boolean | null;
  registrationType?: CourseRegistrationType_enum | null;
  requiredEcts?: any | null;
  requiredEventCount?: number | null;
  startTime?: any | null;
  status?: CourseStatus_enum | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  tagline?: string | null;
  title?: string | null;
  updated_at?: any | null;
  weekDay?: Weekday_enum | null;
}

/**
 * order by stddev() on columns of table "Course"
 */
export interface Course_stddev_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Course"
 */
export interface Course_stddev_pop_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Course"
 */
export interface Course_stddev_samp_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by sum() on columns of table "Course"
 */
export interface Course_sum_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Course"
 */
export interface Course_var_pop_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Course"
 */
export interface Course_var_samp_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * order by variance() on columns of table "Course"
 */
export interface Course_variance_order_by {
  achievementCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  basePrice?: order_by | null;
  courseSeriesId?: order_by | null;
  id?: order_by | null;
  maxMissedSessions?: order_by | null;
  maxParticipants?: order_by | null;
  programId?: order_by | null;
  requiredEcts?: order_by | null;
  requiredEventCount?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "DegreeParticipationStats". All fields are combined with a logical 'AND'.
 */
export interface DegreeParticipationStats_bool_exp {
  _and?: DegreeParticipationStats_bool_exp[] | null;
  _not?: DegreeParticipationStats_bool_exp | null;
  _or?: DegreeParticipationStats_bool_exp[] | null;
  attendedEventCount?: bigint_comparison_exp | null;
  degreeCourseId?: Int_comparison_exp | null;
  ectsTotal?: numeric_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "DegreeParticipationStats"
 */
export interface DegreeParticipationStats_insert_input {
  attendedEventCount?: any | null;
  degreeCourseId?: number | null;
  ectsTotal?: any | null;
  userId?: any | null;
}

/**
 * input type for inserting object relation for remote table "DegreeParticipationStats"
 */
export interface DegreeParticipationStats_obj_rel_insert_input {
  data: DegreeParticipationStats_insert_input;
}

/**
 * Ordering options when selecting data from "DegreeParticipationStats".
 */
export interface DegreeParticipationStats_order_by {
  attendedEventCount?: order_by | null;
  degreeCourseId?: order_by | null;
  ectsTotal?: order_by | null;
  userId?: order_by | null;
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
 * Boolean expression to filter rows from the table "InvoiceStatus". All fields are combined with a logical 'AND'.
 */
export interface InvoiceStatus_bool_exp {
  Invoices?: Invoice_bool_exp | null;
  Invoices_aggregate?: Invoice_aggregate_bool_exp | null;
  _and?: InvoiceStatus_bool_exp[] | null;
  _not?: InvoiceStatus_bool_exp | null;
  _or?: InvoiceStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "InvoiceStatus_enum". All fields are combined with logical 'AND'.
 */
export interface InvoiceStatus_enum_comparison_exp {
  _eq?: InvoiceStatus_enum | null;
  _in?: InvoiceStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: InvoiceStatus_enum | null;
  _nin?: InvoiceStatus_enum[] | null;
}

/**
 * input type for inserting data into table "InvoiceStatus"
 */
export interface InvoiceStatus_insert_input {
  Invoices?: Invoice_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "InvoiceStatus"
 */
export interface InvoiceStatus_obj_rel_insert_input {
  data: InvoiceStatus_insert_input;
  on_conflict?: InvoiceStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "InvoiceStatus"
 */
export interface InvoiceStatus_on_conflict {
  constraint: InvoiceStatus_constraint;
  update_columns: InvoiceStatus_update_column[];
  where?: InvoiceStatus_bool_exp | null;
}

export interface Invoice_aggregate_bool_exp {
  count?: Invoice_aggregate_bool_exp_count | null;
}

export interface Invoice_aggregate_bool_exp_count {
  arguments?: Invoice_select_column[] | null;
  distinct?: boolean | null;
  filter?: Invoice_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "Invoice"
 */
export interface Invoice_aggregate_order_by {
  avg?: Invoice_avg_order_by | null;
  count?: order_by | null;
  max?: Invoice_max_order_by | null;
  min?: Invoice_min_order_by | null;
  stddev?: Invoice_stddev_order_by | null;
  stddev_pop?: Invoice_stddev_pop_order_by | null;
  stddev_samp?: Invoice_stddev_samp_order_by | null;
  sum?: Invoice_sum_order_by | null;
  var_pop?: Invoice_var_pop_order_by | null;
  var_samp?: Invoice_var_samp_order_by | null;
  variance?: Invoice_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Invoice"
 */
export interface Invoice_arr_rel_insert_input {
  data: Invoice_insert_input[];
  on_conflict?: Invoice_on_conflict | null;
}

/**
 * order by avg() on columns of table "Invoice"
 */
export interface Invoice_avg_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Invoice". All fields are combined with a logical 'AND'.
 */
export interface Invoice_bool_exp {
  CourseEnrollment?: CourseEnrollment_bool_exp | null;
  InvoiceStatus?: InvoiceStatus_bool_exp | null;
  JobPosting?: JobPosting_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: Invoice_bool_exp[] | null;
  _not?: Invoice_bool_exp | null;
  _or?: Invoice_bool_exp[] | null;
  courseEnrollmentId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  currency?: String_comparison_exp | null;
  grossTotal?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  invoiceDate?: date_comparison_exp | null;
  invoiceNumber?: String_comparison_exp | null;
  jobPostingId?: Int_comparison_exp | null;
  netTotal?: Int_comparison_exp | null;
  notes?: String_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  status?: InvoiceStatus_enum_comparison_exp | null;
  stripeCheckoutSessionId?: String_comparison_exp | null;
  stripeHostedInvoiceUrl?: String_comparison_exp | null;
  stripeInvoiceId?: String_comparison_exp | null;
  stripeInvoicePdfUrl?: String_comparison_exp | null;
  stripePaymentIntentId?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
  vatTotal?: Int_comparison_exp | null;
}

/**
 * input type for inserting data into table "Invoice"
 */
export interface Invoice_insert_input {
  CourseEnrollment?: CourseEnrollment_obj_rel_insert_input | null;
  InvoiceStatus?: InvoiceStatus_obj_rel_insert_input | null;
  JobPosting?: JobPosting_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  courseEnrollmentId?: number | null;
  created_at?: any | null;
  currency?: string | null;
  grossTotal?: number | null;
  id?: number | null;
  invoiceDate?: any | null;
  invoiceNumber?: string | null;
  jobPostingId?: number | null;
  netTotal?: number | null;
  notes?: string | null;
  organizationId?: number | null;
  status?: InvoiceStatus_enum | null;
  stripeCheckoutSessionId?: string | null;
  stripeHostedInvoiceUrl?: string | null;
  stripeInvoiceId?: string | null;
  stripeInvoicePdfUrl?: string | null;
  stripePaymentIntentId?: string | null;
  updated_at?: any | null;
  userId?: any | null;
  vatTotal?: number | null;
}

/**
 * order by max() on columns of table "Invoice"
 */
export interface Invoice_max_order_by {
  courseEnrollmentId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  invoiceDate?: order_by | null;
  invoiceNumber?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  notes?: order_by | null;
  organizationId?: order_by | null;
  stripeCheckoutSessionId?: order_by | null;
  stripeHostedInvoiceUrl?: order_by | null;
  stripeInvoiceId?: order_by | null;
  stripeInvoicePdfUrl?: order_by | null;
  stripePaymentIntentId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by min() on columns of table "Invoice"
 */
export interface Invoice_min_order_by {
  courseEnrollmentId?: order_by | null;
  created_at?: order_by | null;
  currency?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  invoiceDate?: order_by | null;
  invoiceNumber?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  notes?: order_by | null;
  organizationId?: order_by | null;
  stripeCheckoutSessionId?: order_by | null;
  stripeHostedInvoiceUrl?: order_by | null;
  stripeInvoiceId?: order_by | null;
  stripeInvoicePdfUrl?: order_by | null;
  stripePaymentIntentId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * on_conflict condition type for table "Invoice"
 */
export interface Invoice_on_conflict {
  constraint: Invoice_constraint;
  update_columns: Invoice_update_column[];
  where?: Invoice_bool_exp | null;
}

/**
 * order by stddev() on columns of table "Invoice"
 */
export interface Invoice_stddev_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Invoice"
 */
export interface Invoice_stddev_pop_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Invoice"
 */
export interface Invoice_stddev_samp_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by sum() on columns of table "Invoice"
 */
export interface Invoice_sum_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Invoice"
 */
export interface Invoice_var_pop_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Invoice"
 */
export interface Invoice_var_samp_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * order by variance() on columns of table "Invoice"
 */
export interface Invoice_variance_order_by {
  courseEnrollmentId?: order_by | null;
  grossTotal?: order_by | null;
  id?: order_by | null;
  jobPostingId?: order_by | null;
  netTotal?: order_by | null;
  organizationId?: order_by | null;
  vatTotal?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "JobOccupation". All fields are combined with a logical 'AND'.
 */
export interface JobOccupation_bool_exp {
  JobPostings?: JobPosting_bool_exp | null;
  JobPostings_aggregate?: JobPosting_aggregate_bool_exp | null;
  _and?: JobOccupation_bool_exp[] | null;
  _not?: JobOccupation_bool_exp | null;
  _or?: JobOccupation_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "JobOccupation_enum". All fields are combined with logical 'AND'.
 */
export interface JobOccupation_enum_comparison_exp {
  _eq?: JobOccupation_enum | null;
  _in?: JobOccupation_enum[] | null;
  _is_null?: boolean | null;
  _neq?: JobOccupation_enum | null;
  _nin?: JobOccupation_enum[] | null;
}

/**
 * input type for inserting data into table "JobOccupation"
 */
export interface JobOccupation_insert_input {
  JobPostings?: JobPosting_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "JobOccupation"
 */
export interface JobOccupation_obj_rel_insert_input {
  data: JobOccupation_insert_input;
  on_conflict?: JobOccupation_on_conflict | null;
}

/**
 * on_conflict condition type for table "JobOccupation"
 */
export interface JobOccupation_on_conflict {
  constraint: JobOccupation_constraint;
  update_columns: JobOccupation_update_column[];
  where?: JobOccupation_bool_exp | null;
}

export interface JobPortal_aggregate_bool_exp {
  count?: JobPortal_aggregate_bool_exp_count | null;
}

export interface JobPortal_aggregate_bool_exp_count {
  arguments?: JobPortal_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobPortal_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "JobPortal"
 */
export interface JobPortal_aggregate_order_by {
  avg?: JobPortal_avg_order_by | null;
  count?: order_by | null;
  max?: JobPortal_max_order_by | null;
  min?: JobPortal_min_order_by | null;
  stddev?: JobPortal_stddev_order_by | null;
  stddev_pop?: JobPortal_stddev_pop_order_by | null;
  stddev_samp?: JobPortal_stddev_samp_order_by | null;
  sum?: JobPortal_sum_order_by | null;
  var_pop?: JobPortal_var_pop_order_by | null;
  var_samp?: JobPortal_var_samp_order_by | null;
  variance?: JobPortal_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "JobPortal"
 */
export interface JobPortal_arr_rel_insert_input {
  data: JobPortal_insert_input[];
  on_conflict?: JobPortal_on_conflict | null;
}

/**
 * order by avg() on columns of table "JobPortal"
 */
export interface JobPortal_avg_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "JobPortal". All fields are combined with a logical 'AND'.
 */
export interface JobPortal_bool_exp {
  AppSetting?: AppSettings_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  _and?: JobPortal_bool_exp[] | null;
  _not?: JobPortal_bool_exp | null;
  _or?: JobPortal_bool_exp[] | null;
  appName?: String_comparison_exp | null;
  contactEmail?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  defaultRegion?: JobRegion_enum_comparison_exp | null;
  id?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  slug?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobPortal"
 */
export interface JobPortal_insert_input {
  AppSetting?: AppSettings_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  appName?: string | null;
  contactEmail?: string | null;
  created_at?: any | null;
  defaultRegion?: JobRegion_enum | null;
  id?: number | null;
  organizationId?: number | null;
  slug?: string | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "JobPortal"
 */
export interface JobPortal_max_order_by {
  appName?: order_by | null;
  contactEmail?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  slug?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "JobPortal"
 */
export interface JobPortal_min_order_by {
  appName?: order_by | null;
  contactEmail?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  slug?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "JobPortal"
 */
export interface JobPortal_on_conflict {
  constraint: JobPortal_constraint;
  update_columns: JobPortal_update_column[];
  where?: JobPortal_bool_exp | null;
}

/**
 * order by stddev() on columns of table "JobPortal"
 */
export interface JobPortal_stddev_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "JobPortal"
 */
export interface JobPortal_stddev_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "JobPortal"
 */
export interface JobPortal_stddev_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "JobPortal"
 */
export interface JobPortal_sum_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "JobPortal"
 */
export interface JobPortal_var_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "JobPortal"
 */
export interface JobPortal_var_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "JobPortal"
 */
export interface JobPortal_variance_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
}

export interface JobPostingCredit_aggregate_bool_exp {
  bool_and?: JobPostingCredit_aggregate_bool_exp_bool_and | null;
  bool_or?: JobPostingCredit_aggregate_bool_exp_bool_or | null;
  count?: JobPostingCredit_aggregate_bool_exp_count | null;
}

export interface JobPostingCredit_aggregate_bool_exp_bool_and {
  arguments: JobPostingCredit_select_column_JobPostingCredit_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: JobPostingCredit_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface JobPostingCredit_aggregate_bool_exp_bool_or {
  arguments: JobPostingCredit_select_column_JobPostingCredit_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: JobPostingCredit_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface JobPostingCredit_aggregate_bool_exp_count {
  arguments?: JobPostingCredit_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobPostingCredit_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "JobPostingCredit"
 */
export interface JobPostingCredit_aggregate_order_by {
  avg?: JobPostingCredit_avg_order_by | null;
  count?: order_by | null;
  max?: JobPostingCredit_max_order_by | null;
  min?: JobPostingCredit_min_order_by | null;
  stddev?: JobPostingCredit_stddev_order_by | null;
  stddev_pop?: JobPostingCredit_stddev_pop_order_by | null;
  stddev_samp?: JobPostingCredit_stddev_samp_order_by | null;
  sum?: JobPostingCredit_sum_order_by | null;
  var_pop?: JobPostingCredit_var_pop_order_by | null;
  var_samp?: JobPostingCredit_var_samp_order_by | null;
  variance?: JobPostingCredit_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "JobPostingCredit"
 */
export interface JobPostingCredit_arr_rel_insert_input {
  data: JobPostingCredit_insert_input[];
  on_conflict?: JobPostingCredit_on_conflict | null;
}

/**
 * order by avg() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_avg_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "JobPostingCredit". All fields are combined with a logical 'AND'.
 */
export interface JobPostingCredit_bool_exp {
  JobPostingType?: JobPostingType_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  _and?: JobPostingCredit_bool_exp[] | null;
  _not?: JobPostingCredit_bool_exp | null;
  _or?: JobPostingCredit_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  jobPostingType?: JobPostingType_enum_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  remaining?: Int_comparison_exp | null;
  unlimited?: Boolean_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobPostingCredit"
 */
export interface JobPostingCredit_insert_input {
  JobPostingType?: JobPostingType_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  jobPostingType?: JobPostingType_enum | null;
  organizationId?: number | null;
  remaining?: number | null;
  unlimited?: boolean | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "JobPostingCredit"
 */
export interface JobPostingCredit_on_conflict {
  constraint: JobPostingCredit_constraint;
  update_columns: JobPostingCredit_update_column[];
  where?: JobPostingCredit_bool_exp | null;
}

/**
 * order by stddev() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_stddev_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_stddev_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_stddev_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by sum() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_sum_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by var_pop() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_var_pop_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by var_samp() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_var_samp_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

/**
 * order by variance() on columns of table "JobPostingCredit"
 */
export interface JobPostingCredit_variance_order_by {
  id?: order_by | null;
  organizationId?: order_by | null;
  remaining?: order_by | null;
}

export interface JobPostingPrice_aggregate_bool_exp {
  count?: JobPostingPrice_aggregate_bool_exp_count | null;
}

export interface JobPostingPrice_aggregate_bool_exp_count {
  arguments?: JobPostingPrice_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobPostingPrice_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "JobPostingPrice"
 */
export interface JobPostingPrice_arr_rel_insert_input {
  data: JobPostingPrice_insert_input[];
  on_conflict?: JobPostingPrice_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "JobPostingPrice". All fields are combined with a logical 'AND'.
 */
export interface JobPostingPrice_bool_exp {
  JobPostingType?: JobPostingType_bool_exp | null;
  _and?: JobPostingPrice_bool_exp[] | null;
  _not?: JobPostingPrice_bool_exp | null;
  _or?: JobPostingPrice_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  currency?: String_comparison_exp | null;
  durationDays?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  jobPostingType?: JobPostingType_enum_comparison_exp | null;
  price?: Int_comparison_exp | null;
  stripePriceId?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  vatRate?: numeric_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobPostingPrice"
 */
export interface JobPostingPrice_insert_input {
  JobPostingType?: JobPostingType_obj_rel_insert_input | null;
  created_at?: any | null;
  currency?: string | null;
  durationDays?: number | null;
  id?: number | null;
  jobPostingType?: JobPostingType_enum | null;
  price?: number | null;
  stripePriceId?: string | null;
  updated_at?: any | null;
  vatRate?: any | null;
}

/**
 * on_conflict condition type for table "JobPostingPrice"
 */
export interface JobPostingPrice_on_conflict {
  constraint: JobPostingPrice_constraint;
  update_columns: JobPostingPrice_update_column[];
  where?: JobPostingPrice_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "JobPostingStatus". All fields are combined with a logical 'AND'.
 */
export interface JobPostingStatus_bool_exp {
  JobPostings?: JobPosting_bool_exp | null;
  JobPostings_aggregate?: JobPosting_aggregate_bool_exp | null;
  _and?: JobPostingStatus_bool_exp[] | null;
  _not?: JobPostingStatus_bool_exp | null;
  _or?: JobPostingStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "JobPostingStatus_enum". All fields are combined with logical 'AND'.
 */
export interface JobPostingStatus_enum_comparison_exp {
  _eq?: JobPostingStatus_enum | null;
  _in?: JobPostingStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: JobPostingStatus_enum | null;
  _nin?: JobPostingStatus_enum[] | null;
}

/**
 * input type for inserting data into table "JobPostingStatus"
 */
export interface JobPostingStatus_insert_input {
  JobPostings?: JobPosting_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "JobPostingStatus"
 */
export interface JobPostingStatus_obj_rel_insert_input {
  data: JobPostingStatus_insert_input;
  on_conflict?: JobPostingStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "JobPostingStatus"
 */
export interface JobPostingStatus_on_conflict {
  constraint: JobPostingStatus_constraint;
  update_columns: JobPostingStatus_update_column[];
  where?: JobPostingStatus_bool_exp | null;
}

export interface JobPostingTag_aggregate_bool_exp {
  count?: JobPostingTag_aggregate_bool_exp_count | null;
}

export interface JobPostingTag_aggregate_bool_exp_count {
  arguments?: JobPostingTag_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobPostingTag_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "JobPostingTag"
 */
export interface JobPostingTag_arr_rel_insert_input {
  data: JobPostingTag_insert_input[];
  on_conflict?: JobPostingTag_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "JobPostingTag". All fields are combined with a logical 'AND'.
 */
export interface JobPostingTag_bool_exp {
  JobPosting?: JobPosting_bool_exp | null;
  _and?: JobPostingTag_bool_exp[] | null;
  _not?: JobPostingTag_bool_exp | null;
  _or?: JobPostingTag_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  jobPostingId?: Int_comparison_exp | null;
  name?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobPostingTag"
 */
export interface JobPostingTag_insert_input {
  JobPosting?: JobPosting_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  jobPostingId?: number | null;
  name?: string | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "JobPostingTag"
 */
export interface JobPostingTag_on_conflict {
  constraint: JobPostingTag_constraint;
  update_columns: JobPostingTag_update_column[];
  where?: JobPostingTag_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "JobPostingType". All fields are combined with a logical 'AND'.
 */
export interface JobPostingType_bool_exp {
  JobPostingPrices?: JobPostingPrice_bool_exp | null;
  JobPostingPrices_aggregate?: JobPostingPrice_aggregate_bool_exp | null;
  JobPostings?: JobPosting_bool_exp | null;
  JobPostings_aggregate?: JobPosting_aggregate_bool_exp | null;
  _and?: JobPostingType_bool_exp[] | null;
  _not?: JobPostingType_bool_exp | null;
  _or?: JobPostingType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "JobPostingType_enum". All fields are combined with logical 'AND'.
 */
export interface JobPostingType_enum_comparison_exp {
  _eq?: JobPostingType_enum | null;
  _in?: JobPostingType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: JobPostingType_enum | null;
  _nin?: JobPostingType_enum[] | null;
}

/**
 * input type for inserting data into table "JobPostingType"
 */
export interface JobPostingType_insert_input {
  JobPostingPrices?: JobPostingPrice_arr_rel_insert_input | null;
  JobPostings?: JobPosting_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "JobPostingType"
 */
export interface JobPostingType_obj_rel_insert_input {
  data: JobPostingType_insert_input;
  on_conflict?: JobPostingType_on_conflict | null;
}

/**
 * on_conflict condition type for table "JobPostingType"
 */
export interface JobPostingType_on_conflict {
  constraint: JobPostingType_constraint;
  update_columns: JobPostingType_update_column[];
  where?: JobPostingType_bool_exp | null;
}

export interface JobPosting_aggregate_bool_exp {
  bool_and?: JobPosting_aggregate_bool_exp_bool_and | null;
  bool_or?: JobPosting_aggregate_bool_exp_bool_or | null;
  count?: JobPosting_aggregate_bool_exp_count | null;
}

export interface JobPosting_aggregate_bool_exp_bool_and {
  arguments: JobPosting_select_column_JobPosting_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: JobPosting_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface JobPosting_aggregate_bool_exp_bool_or {
  arguments: JobPosting_select_column_JobPosting_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: JobPosting_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface JobPosting_aggregate_bool_exp_count {
  arguments?: JobPosting_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobPosting_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "JobPosting"
 */
export interface JobPosting_aggregate_order_by {
  avg?: JobPosting_avg_order_by | null;
  count?: order_by | null;
  max?: JobPosting_max_order_by | null;
  min?: JobPosting_min_order_by | null;
  stddev?: JobPosting_stddev_order_by | null;
  stddev_pop?: JobPosting_stddev_pop_order_by | null;
  stddev_samp?: JobPosting_stddev_samp_order_by | null;
  sum?: JobPosting_sum_order_by | null;
  var_pop?: JobPosting_var_pop_order_by | null;
  var_samp?: JobPosting_var_samp_order_by | null;
  variance?: JobPosting_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "JobPosting"
 */
export interface JobPosting_arr_rel_insert_input {
  data: JobPosting_insert_input[];
  on_conflict?: JobPosting_on_conflict | null;
}

/**
 * order by avg() on columns of table "JobPosting"
 */
export interface JobPosting_avg_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "JobPosting". All fields are combined with a logical 'AND'.
 */
export interface JobPosting_bool_exp {
  ContactUser?: User_bool_exp | null;
  Invoices?: Invoice_bool_exp | null;
  Invoices_aggregate?: Invoice_aggregate_bool_exp | null;
  JobOccupation?: JobOccupation_bool_exp | null;
  JobPostingStatus?: JobPostingStatus_bool_exp | null;
  JobPostingTags?: JobPostingTag_bool_exp | null;
  JobPostingTags_aggregate?: JobPostingTag_aggregate_bool_exp | null;
  JobPostingType?: JobPostingType_bool_exp | null;
  JobRegion?: JobRegion_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  RestrictedToOrganization?: Organization_bool_exp | null;
  SavedJobPostings?: SavedJobPosting_bool_exp | null;
  SavedJobPostings_aggregate?: SavedJobPosting_aggregate_bool_exp | null;
  _and?: JobPosting_bool_exp[] | null;
  _not?: JobPosting_bool_exp | null;
  _or?: JobPosting_bool_exp[] | null;
  applicationDeadline?: date_comparison_exp | null;
  contactUserId?: uuid_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  customCompany?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  durationText?: String_comparison_exp | null;
  expiresAt?: timestamptz_comparison_exp | null;
  featured?: Boolean_comparison_exp | null;
  hoursPerWeek?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  international?: Boolean_comparison_exp | null;
  internationalDescription?: String_comparison_exp | null;
  language?: String_comparison_exp | null;
  legacyStujoId?: Int_comparison_exp | null;
  location?: String_comparison_exp | null;
  occupation?: JobOccupation_enum_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  pdfUrl?: String_comparison_exp | null;
  publishedAt?: timestamptz_comparison_exp | null;
  region?: JobRegion_enum_comparison_exp | null;
  requirement?: String_comparison_exp | null;
  restrictedToOrganizationId?: Int_comparison_exp | null;
  salaryText?: String_comparison_exp | null;
  shortDescription?: String_comparison_exp | null;
  slug?: String_comparison_exp | null;
  startText?: String_comparison_exp | null;
  status?: JobPostingStatus_enum_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: JobPostingType_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  views?: Int_comparison_exp | null;
  workExperienceRequired?: Boolean_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobPosting"
 */
export interface JobPosting_insert_input {
  ContactUser?: User_obj_rel_insert_input | null;
  Invoices?: Invoice_arr_rel_insert_input | null;
  JobOccupation?: JobOccupation_obj_rel_insert_input | null;
  JobPostingStatus?: JobPostingStatus_obj_rel_insert_input | null;
  JobPostingTags?: JobPostingTag_arr_rel_insert_input | null;
  JobPostingType?: JobPostingType_obj_rel_insert_input | null;
  JobRegion?: JobRegion_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  RestrictedToOrganization?: Organization_obj_rel_insert_input | null;
  SavedJobPostings?: SavedJobPosting_arr_rel_insert_input | null;
  applicationDeadline?: any | null;
  contactUserId?: any | null;
  created_at?: any | null;
  customCompany?: string | null;
  description?: string | null;
  durationText?: string | null;
  expiresAt?: any | null;
  featured?: boolean | null;
  hoursPerWeek?: number | null;
  id?: number | null;
  international?: boolean | null;
  internationalDescription?: string | null;
  language?: string | null;
  legacyStujoId?: number | null;
  location?: string | null;
  occupation?: JobOccupation_enum | null;
  organizationId?: number | null;
  pdfUrl?: string | null;
  publishedAt?: any | null;
  region?: JobRegion_enum | null;
  requirement?: string | null;
  restrictedToOrganizationId?: number | null;
  salaryText?: string | null;
  shortDescription?: string | null;
  slug?: string | null;
  startText?: string | null;
  status?: JobPostingStatus_enum | null;
  title?: string | null;
  type?: JobPostingType_enum | null;
  updated_at?: any | null;
  views?: number | null;
  workExperienceRequired?: boolean | null;
}

/**
 * order by max() on columns of table "JobPosting"
 */
export interface JobPosting_max_order_by {
  applicationDeadline?: order_by | null;
  contactUserId?: order_by | null;
  created_at?: order_by | null;
  customCompany?: order_by | null;
  description?: order_by | null;
  durationText?: order_by | null;
  expiresAt?: order_by | null;
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  internationalDescription?: order_by | null;
  language?: order_by | null;
  legacyStujoId?: order_by | null;
  location?: order_by | null;
  organizationId?: order_by | null;
  pdfUrl?: order_by | null;
  publishedAt?: order_by | null;
  requirement?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  salaryText?: order_by | null;
  shortDescription?: order_by | null;
  slug?: order_by | null;
  startText?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  views?: order_by | null;
}

/**
 * order by min() on columns of table "JobPosting"
 */
export interface JobPosting_min_order_by {
  applicationDeadline?: order_by | null;
  contactUserId?: order_by | null;
  created_at?: order_by | null;
  customCompany?: order_by | null;
  description?: order_by | null;
  durationText?: order_by | null;
  expiresAt?: order_by | null;
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  internationalDescription?: order_by | null;
  language?: order_by | null;
  legacyStujoId?: order_by | null;
  location?: order_by | null;
  organizationId?: order_by | null;
  pdfUrl?: order_by | null;
  publishedAt?: order_by | null;
  requirement?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  salaryText?: order_by | null;
  shortDescription?: order_by | null;
  slug?: order_by | null;
  startText?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  views?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "JobPosting"
 */
export interface JobPosting_obj_rel_insert_input {
  data: JobPosting_insert_input;
  on_conflict?: JobPosting_on_conflict | null;
}

/**
 * on_conflict condition type for table "JobPosting"
 */
export interface JobPosting_on_conflict {
  constraint: JobPosting_constraint;
  update_columns: JobPosting_update_column[];
  where?: JobPosting_bool_exp | null;
}

/**
 * order by stddev() on columns of table "JobPosting"
 */
export interface JobPosting_stddev_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "JobPosting"
 */
export interface JobPosting_stddev_pop_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "JobPosting"
 */
export interface JobPosting_stddev_samp_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by sum() on columns of table "JobPosting"
 */
export interface JobPosting_sum_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by var_pop() on columns of table "JobPosting"
 */
export interface JobPosting_var_pop_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by var_samp() on columns of table "JobPosting"
 */
export interface JobPosting_var_samp_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * order by variance() on columns of table "JobPosting"
 */
export interface JobPosting_variance_order_by {
  hoursPerWeek?: order_by | null;
  id?: order_by | null;
  legacyStujoId?: order_by | null;
  organizationId?: order_by | null;
  restrictedToOrganizationId?: order_by | null;
  views?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "JobRegion". All fields are combined with a logical 'AND'.
 */
export interface JobRegion_bool_exp {
  JobPostings?: JobPosting_bool_exp | null;
  JobPostings_aggregate?: JobPosting_aggregate_bool_exp | null;
  _and?: JobRegion_bool_exp[] | null;
  _not?: JobRegion_bool_exp | null;
  _or?: JobRegion_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "JobRegion_enum". All fields are combined with logical 'AND'.
 */
export interface JobRegion_enum_comparison_exp {
  _eq?: JobRegion_enum | null;
  _in?: JobRegion_enum[] | null;
  _is_null?: boolean | null;
  _neq?: JobRegion_enum | null;
  _nin?: JobRegion_enum[] | null;
}

/**
 * input type for inserting data into table "JobRegion"
 */
export interface JobRegion_insert_input {
  JobPostings?: JobPosting_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "JobRegion"
 */
export interface JobRegion_obj_rel_insert_input {
  data: JobRegion_insert_input;
  on_conflict?: JobRegion_on_conflict | null;
}

/**
 * on_conflict condition type for table "JobRegion"
 */
export interface JobRegion_on_conflict {
  constraint: JobRegion_constraint;
  update_columns: JobRegion_update_column[];
  where?: JobRegion_bool_exp | null;
}

export interface JobSliderJobType_aggregate_bool_exp {
  count?: JobSliderJobType_aggregate_bool_exp_count | null;
}

export interface JobSliderJobType_aggregate_bool_exp_count {
  arguments?: JobSliderJobType_select_column[] | null;
  distinct?: boolean | null;
  filter?: JobSliderJobType_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "JobSliderJobType"
 */
export interface JobSliderJobType_arr_rel_insert_input {
  data: JobSliderJobType_insert_input[];
  on_conflict?: JobSliderJobType_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "JobSliderJobType". All fields are combined with a logical 'AND'.
 */
export interface JobSliderJobType_bool_exp {
  JobPostingType?: JobPostingType_bool_exp | null;
  JobSliderOption?: CourseGroupOption_bool_exp | null;
  _and?: JobSliderJobType_bool_exp[] | null;
  _not?: JobSliderJobType_bool_exp | null;
  _or?: JobSliderJobType_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  jobSliderOptionId?: Int_comparison_exp | null;
  jobType?: JobPostingType_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "JobSliderJobType"
 */
export interface JobSliderJobType_insert_input {
  JobPostingType?: JobPostingType_obj_rel_insert_input | null;
  JobSliderOption?: CourseGroupOption_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  jobSliderOptionId?: number | null;
  jobType?: JobPostingType_enum | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "JobSliderJobType"
 */
export interface JobSliderJobType_on_conflict {
  constraint: JobSliderJobType_constraint;
  update_columns: JobSliderJobType_update_column[];
  where?: JobSliderJobType_bool_exp | null;
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
 * Boolean expression to filter rows from the table "MailTemplateType". All fields are combined with a logical 'AND'.
 */
export interface MailTemplateType_bool_exp {
  MailTemplates?: MailTemplate_bool_exp | null;
  MailTemplates_aggregate?: MailTemplate_aggregate_bool_exp | null;
  _and?: MailTemplateType_bool_exp[] | null;
  _not?: MailTemplateType_bool_exp | null;
  _or?: MailTemplateType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "MailTemplateType_enum". All fields are combined with logical 'AND'.
 */
export interface MailTemplateType_enum_comparison_exp {
  _eq?: MailTemplateType_enum | null;
  _in?: MailTemplateType_enum[] | null;
  _is_null?: boolean | null;
  _neq?: MailTemplateType_enum | null;
  _nin?: MailTemplateType_enum[] | null;
}

/**
 * input type for inserting data into table "MailTemplateType"
 */
export interface MailTemplateType_insert_input {
  MailTemplates?: MailTemplate_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "MailTemplateType"
 */
export interface MailTemplateType_obj_rel_insert_input {
  data: MailTemplateType_insert_input;
  on_conflict?: MailTemplateType_on_conflict | null;
}

/**
 * on_conflict condition type for table "MailTemplateType"
 */
export interface MailTemplateType_on_conflict {
  constraint: MailTemplateType_constraint;
  update_columns: MailTemplateType_update_column[];
  where?: MailTemplateType_bool_exp | null;
}

/**
 * Ordering options when selecting data from "MailTemplateType".
 */
export interface MailTemplateType_order_by {
  MailTemplates_aggregate?: MailTemplate_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface MailTemplate_aggregate_bool_exp {
  count?: MailTemplate_aggregate_bool_exp_count | null;
}

export interface MailTemplate_aggregate_bool_exp_count {
  arguments?: MailTemplate_select_column[] | null;
  distinct?: boolean | null;
  filter?: MailTemplate_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "MailTemplate"
 */
export interface MailTemplate_aggregate_order_by {
  avg?: MailTemplate_avg_order_by | null;
  count?: order_by | null;
  max?: MailTemplate_max_order_by | null;
  min?: MailTemplate_min_order_by | null;
  stddev?: MailTemplate_stddev_order_by | null;
  stddev_pop?: MailTemplate_stddev_pop_order_by | null;
  stddev_samp?: MailTemplate_stddev_samp_order_by | null;
  sum?: MailTemplate_sum_order_by | null;
  var_pop?: MailTemplate_var_pop_order_by | null;
  var_samp?: MailTemplate_var_samp_order_by | null;
  variance?: MailTemplate_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "MailTemplate"
 */
export interface MailTemplate_arr_rel_insert_input {
  data: MailTemplate_insert_input[];
  on_conflict?: MailTemplate_on_conflict | null;
}

/**
 * order by avg() on columns of table "MailTemplate"
 */
export interface MailTemplate_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "MailTemplate". All fields are combined with a logical 'AND'.
 */
export interface MailTemplate_bool_exp {
  Course?: Course_bool_exp | null;
  MailTemplateType?: MailTemplateType_bool_exp | null;
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
  type?: MailTemplateType_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "MailTemplate"
 */
export interface MailTemplate_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  MailTemplateType?: MailTemplateType_obj_rel_insert_input | null;
  bcc?: string | null;
  cc?: string | null;
  content?: string | null;
  courseId?: number | null;
  created_at?: any | null;
  from?: string | null;
  id?: number | null;
  subject?: string | null;
  type?: MailTemplateType_enum | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "MailTemplate"
 */
export interface MailTemplate_max_order_by {
  bcc?: order_by | null;
  cc?: order_by | null;
  content?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  from?: order_by | null;
  id?: order_by | null;
  subject?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "MailTemplate"
 */
export interface MailTemplate_min_order_by {
  bcc?: order_by | null;
  cc?: order_by | null;
  content?: order_by | null;
  courseId?: order_by | null;
  created_at?: order_by | null;
  from?: order_by | null;
  id?: order_by | null;
  subject?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "MailTemplate"
 */
export interface MailTemplate_on_conflict {
  constraint: MailTemplate_constraint;
  update_columns: MailTemplate_update_column[];
  where?: MailTemplate_bool_exp | null;
}

/**
 * Ordering options when selecting data from "MailTemplate".
 */
export interface MailTemplate_order_by {
  Course?: Course_order_by | null;
  MailTemplateType?: MailTemplateType_order_by | null;
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
 * order by stddev() on columns of table "MailTemplate"
 */
export interface MailTemplate_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "MailTemplate"
 */
export interface MailTemplate_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "MailTemplate"
 */
export interface MailTemplate_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "MailTemplate"
 */
export interface MailTemplate_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "MailTemplate"
 */
export interface MailTemplate_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "MailTemplate"
 */
export interface MailTemplate_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "MailTemplate"
 */
export interface MailTemplate_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
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
  canManageDegrees?: Boolean_comparison_exp | null;
  canManageEvents?: Boolean_comparison_exp | null;
  canManageJobs?: Boolean_comparison_exp | null;
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
  canManageDegrees?: boolean | null;
  canManageEvents?: boolean | null;
  canManageJobs?: boolean | null;
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
  canManageDegrees?: order_by | null;
  canManageEvents?: order_by | null;
  canManageJobs?: order_by | null;
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

export interface OrganizationNewsletterSubscription_aggregate_bool_exp {
  count?: OrganizationNewsletterSubscription_aggregate_bool_exp_count | null;
}

export interface OrganizationNewsletterSubscription_aggregate_bool_exp_count {
  arguments?: OrganizationNewsletterSubscription_select_column[] | null;
  distinct?: boolean | null;
  filter?: OrganizationNewsletterSubscription_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_aggregate_order_by {
  avg?: OrganizationNewsletterSubscription_avg_order_by | null;
  count?: order_by | null;
  max?: OrganizationNewsletterSubscription_max_order_by | null;
  min?: OrganizationNewsletterSubscription_min_order_by | null;
  stddev?: OrganizationNewsletterSubscription_stddev_order_by | null;
  stddev_pop?: OrganizationNewsletterSubscription_stddev_pop_order_by | null;
  stddev_samp?: OrganizationNewsletterSubscription_stddev_samp_order_by | null;
  sum?: OrganizationNewsletterSubscription_sum_order_by | null;
  var_pop?: OrganizationNewsletterSubscription_var_pop_order_by | null;
  var_samp?: OrganizationNewsletterSubscription_var_samp_order_by | null;
  variance?: OrganizationNewsletterSubscription_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_arr_rel_insert_input {
  data: OrganizationNewsletterSubscription_insert_input[];
  on_conflict?: OrganizationNewsletterSubscription_on_conflict | null;
}

/**
 * order by avg() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_avg_order_by {
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "OrganizationNewsletterSubscription". All fields are combined with a logical 'AND'.
 */
export interface OrganizationNewsletterSubscription_bool_exp {
  Organization?: Organization_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: OrganizationNewsletterSubscription_bool_exp[] | null;
  _not?: OrganizationNewsletterSubscription_bool_exp | null;
  _or?: OrganizationNewsletterSubscription_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  errorMessage?: String_comparison_exp | null;
  externalSubscriberId?: String_comparison_exp | null;
  lastSyncedAt?: timestamptz_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  source?: String_comparison_exp | null;
  status?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_insert_input {
  Organization?: Organization_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  errorMessage?: string | null;
  externalSubscriberId?: string | null;
  lastSyncedAt?: any | null;
  organizationId?: number | null;
  source?: string | null;
  status?: string | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_max_order_by {
  created_at?: order_by | null;
  errorMessage?: order_by | null;
  externalSubscriberId?: order_by | null;
  lastSyncedAt?: order_by | null;
  organizationId?: order_by | null;
  source?: order_by | null;
  status?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_min_order_by {
  created_at?: order_by | null;
  errorMessage?: order_by | null;
  externalSubscriberId?: order_by | null;
  lastSyncedAt?: order_by | null;
  organizationId?: order_by | null;
  source?: order_by | null;
  status?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * on_conflict condition type for table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_on_conflict {
  constraint: OrganizationNewsletterSubscription_constraint;
  update_columns: OrganizationNewsletterSubscription_update_column[];
  where?: OrganizationNewsletterSubscription_bool_exp | null;
}

/**
 * order by stddev() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_stddev_order_by {
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_stddev_pop_order_by {
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_stddev_samp_order_by {
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_sum_order_by {
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_var_pop_order_by {
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_var_samp_order_by {
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "OrganizationNewsletterSubscription"
 */
export interface OrganizationNewsletterSubscription_variance_order_by {
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
  bool_and?: Organization_aggregate_bool_exp_bool_and | null;
  bool_or?: Organization_aggregate_bool_exp_bool_or | null;
  count?: Organization_aggregate_bool_exp_count | null;
}

export interface Organization_aggregate_bool_exp_bool_and {
  arguments: Organization_select_column_Organization_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: Organization_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Organization_aggregate_bool_exp_bool_or {
  arguments: Organization_select_column_Organization_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: Organization_bool_exp | null;
  predicate: Boolean_comparison_exp;
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
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Organization". All fields are combined with a logical 'AND'.
 */
export interface Organization_bool_exp {
  Country?: Country_bool_exp | null;
  FundedCourses?: CourseFundingOrganization_bool_exp | null;
  FundedCourses_aggregate?: CourseFundingOrganization_aggregate_bool_exp | null;
  JobPortals?: JobPortal_bool_exp | null;
  JobPortals_aggregate?: JobPortal_aggregate_bool_exp | null;
  JobPostingCredits?: JobPostingCredit_bool_exp | null;
  JobPostingCredits_aggregate?: JobPostingCredit_aggregate_bool_exp | null;
  JobPostings?: JobPosting_bool_exp | null;
  JobPostings_aggregate?: JobPosting_aggregate_bool_exp | null;
  OrganizationAdmins?: OrganizationAdmin_bool_exp | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_bool_exp | null;
  OrganizationNewsletterSubscriptions?: OrganizationNewsletterSubscription_bool_exp | null;
  OrganizationNewsletterSubscriptions_aggregate?: OrganizationNewsletterSubscription_aggregate_bool_exp | null;
  OrganizationType?: OrganizationType_bool_exp | null;
  Programs?: Program_bool_exp | null;
  Programs_aggregate?: Program_aggregate_bool_exp | null;
  Projects?: Project_bool_exp | null;
  Projects_aggregate?: Project_aggregate_bool_exp | null;
  Users?: User_bool_exp | null;
  Users_aggregate?: User_aggregate_bool_exp | null;
  _and?: Organization_bool_exp[] | null;
  _not?: Organization_bool_exp | null;
  _or?: Organization_bool_exp[] | null;
  addressLine1?: String_comparison_exp | null;
  addressLine2?: String_comparison_exp | null;
  aliases?: jsonb_comparison_exp | null;
  apiKeyHash?: String_comparison_exp | null;
  bankBic?: String_comparison_exp | null;
  bankIban?: String_comparison_exp | null;
  bankName?: String_comparison_exp | null;
  city?: String_comparison_exp | null;
  country?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  defaultTaxExemptionNote?: String_comparison_exp | null;
  defaultVatRate?: numeric_comparison_exp | null;
  description?: String_comparison_exp | null;
  email?: String_comparison_exp | null;
  formbricksApiKey?: String_comparison_exp | null;
  formbricksApiUrl?: String_comparison_exp | null;
  ghostNewsletterApiKeyConfigured?: Boolean_comparison_exp | null;
  ghostNewsletterApiKeyEncrypted?: String_comparison_exp | null;
  ghostNewsletterApiUrl?: String_comparison_exp | null;
  ghostNewsletterDoubleOptInEnabled?: Boolean_comparison_exp | null;
  ghostNewsletterLabel?: String_comparison_exp | null;
  ghostNewsletterListId?: String_comparison_exp | null;
  ghostNewsletterSlug?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  invoiceFooterText?: String_comparison_exp | null;
  invoiceNumberPrefix?: String_comparison_exp | null;
  legalForm?: String_comparison_exp | null;
  legalName?: String_comparison_exp | null;
  logo?: String_comparison_exp | null;
  managingDirector?: String_comparison_exp | null;
  name?: String_comparison_exp | null;
  newsletterDescription?: String_comparison_exp | null;
  newsletterProvider?: String_comparison_exp | null;
  phone?: String_comparison_exp | null;
  postalCode?: String_comparison_exp | null;
  registerCourt?: String_comparison_exp | null;
  registerNumber?: String_comparison_exp | null;
  stripePublishableKey?: String_comparison_exp | null;
  stripeSecretKey?: String_comparison_exp | null;
  stripeWebhookSecret?: String_comparison_exp | null;
  taxNumber?: String_comparison_exp | null;
  type?: OrganizationType_enum_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  vatId?: String_comparison_exp | null;
  website?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "Organization"
 */
export interface Organization_insert_input {
  Country?: Country_obj_rel_insert_input | null;
  FundedCourses?: CourseFundingOrganization_arr_rel_insert_input | null;
  JobPortals?: JobPortal_arr_rel_insert_input | null;
  JobPostingCredits?: JobPostingCredit_arr_rel_insert_input | null;
  JobPostings?: JobPosting_arr_rel_insert_input | null;
  OrganizationAdmins?: OrganizationAdmin_arr_rel_insert_input | null;
  OrganizationNewsletterSubscriptions?: OrganizationNewsletterSubscription_arr_rel_insert_input | null;
  OrganizationType?: OrganizationType_obj_rel_insert_input | null;
  Programs?: Program_arr_rel_insert_input | null;
  Projects?: Project_arr_rel_insert_input | null;
  Users?: User_arr_rel_insert_input | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  aliases?: any | null;
  apiKeyHash?: string | null;
  bankBic?: string | null;
  bankIban?: string | null;
  bankName?: string | null;
  city?: string | null;
  country?: string | null;
  created_at?: any | null;
  defaultTaxExemptionNote?: string | null;
  defaultVatRate?: any | null;
  description?: string | null;
  email?: string | null;
  formbricksApiKey?: string | null;
  formbricksApiUrl?: string | null;
  ghostNewsletterApiKeyConfigured?: boolean | null;
  ghostNewsletterApiKeyEncrypted?: string | null;
  ghostNewsletterApiUrl?: string | null;
  ghostNewsletterDoubleOptInEnabled?: boolean | null;
  ghostNewsletterLabel?: string | null;
  ghostNewsletterListId?: string | null;
  ghostNewsletterSlug?: string | null;
  id?: number | null;
  invoiceFooterText?: string | null;
  invoiceNumberPrefix?: string | null;
  legalForm?: string | null;
  legalName?: string | null;
  logo?: string | null;
  managingDirector?: string | null;
  name?: string | null;
  newsletterDescription?: string | null;
  newsletterProvider?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  registerCourt?: string | null;
  registerNumber?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  stripeWebhookSecret?: string | null;
  taxNumber?: string | null;
  type?: OrganizationType_enum | null;
  updated_at?: any | null;
  vatId?: string | null;
  website?: string | null;
}

/**
 * order by max() on columns of table "Organization"
 */
export interface Organization_max_order_by {
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  apiKeyHash?: order_by | null;
  bankBic?: order_by | null;
  bankIban?: order_by | null;
  bankName?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  defaultTaxExemptionNote?: order_by | null;
  defaultVatRate?: order_by | null;
  description?: order_by | null;
  email?: order_by | null;
  formbricksApiKey?: order_by | null;
  formbricksApiUrl?: order_by | null;
  ghostNewsletterApiKeyEncrypted?: order_by | null;
  ghostNewsletterApiUrl?: order_by | null;
  ghostNewsletterLabel?: order_by | null;
  ghostNewsletterListId?: order_by | null;
  ghostNewsletterSlug?: order_by | null;
  id?: order_by | null;
  invoiceFooterText?: order_by | null;
  invoiceNumberPrefix?: order_by | null;
  legalForm?: order_by | null;
  legalName?: order_by | null;
  logo?: order_by | null;
  managingDirector?: order_by | null;
  name?: order_by | null;
  newsletterDescription?: order_by | null;
  newsletterProvider?: order_by | null;
  phone?: order_by | null;
  postalCode?: order_by | null;
  registerCourt?: order_by | null;
  registerNumber?: order_by | null;
  stripePublishableKey?: order_by | null;
  stripeSecretKey?: order_by | null;
  stripeWebhookSecret?: order_by | null;
  taxNumber?: order_by | null;
  updated_at?: order_by | null;
  vatId?: order_by | null;
  website?: order_by | null;
}

/**
 * order by min() on columns of table "Organization"
 */
export interface Organization_min_order_by {
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  apiKeyHash?: order_by | null;
  bankBic?: order_by | null;
  bankIban?: order_by | null;
  bankName?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  defaultTaxExemptionNote?: order_by | null;
  defaultVatRate?: order_by | null;
  description?: order_by | null;
  email?: order_by | null;
  formbricksApiKey?: order_by | null;
  formbricksApiUrl?: order_by | null;
  ghostNewsletterApiKeyEncrypted?: order_by | null;
  ghostNewsletterApiUrl?: order_by | null;
  ghostNewsletterLabel?: order_by | null;
  ghostNewsletterListId?: order_by | null;
  ghostNewsletterSlug?: order_by | null;
  id?: order_by | null;
  invoiceFooterText?: order_by | null;
  invoiceNumberPrefix?: order_by | null;
  legalForm?: order_by | null;
  legalName?: order_by | null;
  logo?: order_by | null;
  managingDirector?: order_by | null;
  name?: order_by | null;
  newsletterDescription?: order_by | null;
  newsletterProvider?: order_by | null;
  phone?: order_by | null;
  postalCode?: order_by | null;
  registerCourt?: order_by | null;
  registerNumber?: order_by | null;
  stripePublishableKey?: order_by | null;
  stripeSecretKey?: order_by | null;
  stripeWebhookSecret?: order_by | null;
  taxNumber?: order_by | null;
  updated_at?: order_by | null;
  vatId?: order_by | null;
  website?: order_by | null;
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
  Country?: Country_order_by | null;
  FundedCourses_aggregate?: CourseFundingOrganization_aggregate_order_by | null;
  JobPortals_aggregate?: JobPortal_aggregate_order_by | null;
  JobPostingCredits_aggregate?: JobPostingCredit_aggregate_order_by | null;
  JobPostings_aggregate?: JobPosting_aggregate_order_by | null;
  OrganizationAdmins_aggregate?: OrganizationAdmin_aggregate_order_by | null;
  OrganizationNewsletterSubscriptions_aggregate?: OrganizationNewsletterSubscription_aggregate_order_by | null;
  OrganizationType?: OrganizationType_order_by | null;
  Programs_aggregate?: Program_aggregate_order_by | null;
  Projects_aggregate?: Project_aggregate_order_by | null;
  Users_aggregate?: User_aggregate_order_by | null;
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  aliases?: order_by | null;
  apiKeyHash?: order_by | null;
  bankBic?: order_by | null;
  bankIban?: order_by | null;
  bankName?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  defaultTaxExemptionNote?: order_by | null;
  defaultVatRate?: order_by | null;
  description?: order_by | null;
  email?: order_by | null;
  formbricksApiKey?: order_by | null;
  formbricksApiUrl?: order_by | null;
  ghostNewsletterApiKeyConfigured?: order_by | null;
  ghostNewsletterApiKeyEncrypted?: order_by | null;
  ghostNewsletterApiUrl?: order_by | null;
  ghostNewsletterDoubleOptInEnabled?: order_by | null;
  ghostNewsletterLabel?: order_by | null;
  ghostNewsletterListId?: order_by | null;
  ghostNewsletterSlug?: order_by | null;
  id?: order_by | null;
  invoiceFooterText?: order_by | null;
  invoiceNumberPrefix?: order_by | null;
  legalForm?: order_by | null;
  legalName?: order_by | null;
  logo?: order_by | null;
  managingDirector?: order_by | null;
  name?: order_by | null;
  newsletterDescription?: order_by | null;
  newsletterProvider?: order_by | null;
  phone?: order_by | null;
  postalCode?: order_by | null;
  registerCourt?: order_by | null;
  registerNumber?: order_by | null;
  stripePublishableKey?: order_by | null;
  stripeSecretKey?: order_by | null;
  stripeWebhookSecret?: order_by | null;
  taxNumber?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
  vatId?: order_by | null;
  website?: order_by | null;
}

/**
 * order by stddev() on columns of table "Organization"
 */
export interface Organization_stddev_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Organization"
 */
export interface Organization_stddev_pop_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Organization"
 */
export interface Organization_stddev_samp_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by sum() on columns of table "Organization"
 */
export interface Organization_sum_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Organization"
 */
export interface Organization_var_pop_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Organization"
 */
export interface Organization_var_samp_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * order by variance() on columns of table "Organization"
 */
export interface Organization_variance_order_by {
  defaultVatRate?: order_by | null;
  id?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProgramType". All fields are combined with a logical 'AND'.
 */
export interface ProgramType_bool_exp {
  DefaultAttendanceCertificateTemplate?: CertificateTemplate_bool_exp | null;
  Programs?: Program_bool_exp | null;
  Programs_aggregate?: Program_aggregate_bool_exp | null;
  _and?: ProgramType_bool_exp[] | null;
  _not?: ProgramType_bool_exp | null;
  _or?: ProgramType_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  defaultAttendanceCertificateTemplateId?: Int_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProgramType"
 */
export interface ProgramType_insert_input {
  DefaultAttendanceCertificateTemplate?: CertificateTemplate_obj_rel_insert_input | null;
  Programs?: Program_arr_rel_insert_input | null;
  comment?: string | null;
  defaultAttendanceCertificateTemplateId?: number | null;
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
  DefaultAttendanceCertificateTemplate?: CertificateTemplate_order_by | null;
  Programs_aggregate?: Program_aggregate_order_by | null;
  comment?: order_by | null;
  defaultAttendanceCertificateTemplateId?: order_by | null;
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
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Program". All fields are combined with a logical 'AND'.
 */
export interface Program_bool_exp {
  AttendanceCertificateTemplate?: CertificateTemplate_bool_exp | null;
  Courses?: Course_bool_exp | null;
  Courses_aggregate?: Course_aggregate_bool_exp | null;
  DefaultProjectType?: ProjectType_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  ProgramType?: ProgramType_bool_exp | null;
  _and?: Program_bool_exp[] | null;
  _not?: Program_bool_exp | null;
  _or?: Program_bool_exp[] | null;
  achievementCertificateTemplateURL?: String_comparison_exp | null;
  achievementRecordUploadDeadline?: date_comparison_exp | null;
  applicationStart?: date_comparison_exp | null;
  attendanceCertificateTemplateId?: Int_comparison_exp | null;
  attendanceCertificateTemplateURL?: String_comparison_exp | null;
  closingQuestionnaire?: String_comparison_exp | null;
  defaultApplicationEnd?: date_comparison_exp | null;
  defaultFormbricksEnrollmentSurveyUrl?: String_comparison_exp | null;
  defaultMaxMissedSessions?: Int_comparison_exp | null;
  defaultProjectSubmissionDeadline?: timestamptz_comparison_exp | null;
  defaultProjectType?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  lectureEnd?: date_comparison_exp | null;
  lectureStart?: date_comparison_exp | null;
  matrixInstructorRoomId?: String_comparison_exp | null;
  matrixSpaceId?: String_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  projectProposalsEnabledByDefault?: Boolean_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  shortTitle?: String_comparison_exp | null;
  showExtendedApplicationPeriodBanner?: Boolean_comparison_exp | null;
  speakerQuestionnaire?: String_comparison_exp | null;
  startQuestionnaire?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: String_comparison_exp | null;
  visibility?: Boolean_comparison_exp | null;
}

/**
 * input type for inserting data into table "Program"
 */
export interface Program_insert_input {
  AttendanceCertificateTemplate?: CertificateTemplate_obj_rel_insert_input | null;
  Courses?: Course_arr_rel_insert_input | null;
  DefaultProjectType?: ProjectType_obj_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  ProgramType?: ProgramType_obj_rel_insert_input | null;
  achievementCertificateTemplateURL?: string | null;
  achievementRecordUploadDeadline?: any | null;
  applicationStart?: any | null;
  attendanceCertificateTemplateId?: number | null;
  attendanceCertificateTemplateURL?: string | null;
  closingQuestionnaire?: string | null;
  defaultApplicationEnd?: any | null;
  defaultFormbricksEnrollmentSurveyUrl?: string | null;
  defaultMaxMissedSessions?: number | null;
  defaultProjectSubmissionDeadline?: any | null;
  defaultProjectType?: string | null;
  id?: number | null;
  lectureEnd?: any | null;
  lectureStart?: any | null;
  matrixInstructorRoomId?: string | null;
  matrixSpaceId?: string | null;
  organizationId?: number | null;
  projectProposalsEnabledByDefault?: boolean | null;
  published?: boolean | null;
  shortTitle?: string | null;
  showExtendedApplicationPeriodBanner?: boolean | null;
  speakerQuestionnaire?: string | null;
  startQuestionnaire?: string | null;
  title?: string | null;
  type?: string | null;
  visibility?: boolean | null;
}

/**
 * order by max() on columns of table "Program"
 */
export interface Program_max_order_by {
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  defaultProjectSubmissionDeadline?: order_by | null;
  defaultProjectType?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  matrixInstructorRoomId?: order_by | null;
  matrixSpaceId?: order_by | null;
  organizationId?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
}

/**
 * order by min() on columns of table "Program"
 */
export interface Program_min_order_by {
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  defaultProjectSubmissionDeadline?: order_by | null;
  defaultProjectType?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  matrixInstructorRoomId?: order_by | null;
  matrixSpaceId?: order_by | null;
  organizationId?: order_by | null;
  shortTitle?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
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
  AttendanceCertificateTemplate?: CertificateTemplate_order_by | null;
  Courses_aggregate?: Course_aggregate_order_by | null;
  DefaultProjectType?: ProjectType_order_by | null;
  Organization?: Organization_order_by | null;
  ProgramType?: ProgramType_order_by | null;
  achievementCertificateTemplateURL?: order_by | null;
  achievementRecordUploadDeadline?: order_by | null;
  applicationStart?: order_by | null;
  attendanceCertificateTemplateId?: order_by | null;
  attendanceCertificateTemplateURL?: order_by | null;
  closingQuestionnaire?: order_by | null;
  defaultApplicationEnd?: order_by | null;
  defaultFormbricksEnrollmentSurveyUrl?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  defaultProjectSubmissionDeadline?: order_by | null;
  defaultProjectType?: order_by | null;
  id?: order_by | null;
  lectureEnd?: order_by | null;
  lectureStart?: order_by | null;
  matrixInstructorRoomId?: order_by | null;
  matrixSpaceId?: order_by | null;
  organizationId?: order_by | null;
  projectProposalsEnabledByDefault?: order_by | null;
  published?: order_by | null;
  shortTitle?: order_by | null;
  showExtendedApplicationPeriodBanner?: order_by | null;
  speakerQuestionnaire?: order_by | null;
  startQuestionnaire?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
  visibility?: order_by | null;
}

/**
 * order by stddev() on columns of table "Program"
 */
export interface Program_stddev_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Program"
 */
export interface Program_stddev_pop_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Program"
 */
export interface Program_stddev_samp_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by sum() on columns of table "Program"
 */
export interface Program_sum_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Program"
 */
export interface Program_var_pop_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Program"
 */
export interface Program_var_samp_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

/**
 * order by variance() on columns of table "Program"
 */
export interface Program_variance_order_by {
  attendanceCertificateTemplateId?: order_by | null;
  defaultMaxMissedSessions?: order_by | null;
  id?: order_by | null;
  organizationId?: order_by | null;
}

export interface ProjectAuthor_aggregate_bool_exp {
  count?: ProjectAuthor_aggregate_bool_exp_count | null;
}

export interface ProjectAuthor_aggregate_bool_exp_count {
  arguments?: ProjectAuthor_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectAuthor_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectAuthor"
 */
export interface ProjectAuthor_aggregate_order_by {
  avg?: ProjectAuthor_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectAuthor_max_order_by | null;
  min?: ProjectAuthor_min_order_by | null;
  stddev?: ProjectAuthor_stddev_order_by | null;
  stddev_pop?: ProjectAuthor_stddev_pop_order_by | null;
  stddev_samp?: ProjectAuthor_stddev_samp_order_by | null;
  sum?: ProjectAuthor_sum_order_by | null;
  var_pop?: ProjectAuthor_var_pop_order_by | null;
  var_samp?: ProjectAuthor_var_samp_order_by | null;
  variance?: ProjectAuthor_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectAuthor"
 */
export interface ProjectAuthor_arr_rel_insert_input {
  data: ProjectAuthor_insert_input[];
  on_conflict?: ProjectAuthor_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_avg_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectAuthor". All fields are combined with a logical 'AND'.
 */
export interface ProjectAuthor_bool_exp {
  Project?: Project_bool_exp | null;
  ProjectParticipationStatus?: ProjectParticipationStatus_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: ProjectAuthor_bool_exp[] | null;
  _not?: ProjectAuthor_bool_exp | null;
  _or?: ProjectAuthor_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  participationStatus?: ProjectParticipationStatus_enum_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectAuthor"
 */
export interface ProjectAuthor_insert_input {
  Project?: Project_obj_rel_insert_input | null;
  ProjectParticipationStatus?: ProjectParticipationStatus_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  participationStatus?: ProjectParticipationStatus_enum | null;
  projectId?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectAuthor"
 */
export interface ProjectAuthor_on_conflict {
  constraint: ProjectAuthor_constraint;
  update_columns: ProjectAuthor_update_column[];
  where?: ProjectAuthor_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_stddev_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_stddev_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_stddev_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_sum_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_var_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_var_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectAuthor"
 */
export interface ProjectAuthor_variance_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

export interface ProjectBadge_aggregate_bool_exp {
  count?: ProjectBadge_aggregate_bool_exp_count | null;
}

export interface ProjectBadge_aggregate_bool_exp_count {
  arguments?: ProjectBadge_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectBadge_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectBadge"
 */
export interface ProjectBadge_aggregate_order_by {
  avg?: ProjectBadge_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectBadge_max_order_by | null;
  min?: ProjectBadge_min_order_by | null;
  stddev?: ProjectBadge_stddev_order_by | null;
  stddev_pop?: ProjectBadge_stddev_pop_order_by | null;
  stddev_samp?: ProjectBadge_stddev_samp_order_by | null;
  sum?: ProjectBadge_sum_order_by | null;
  var_pop?: ProjectBadge_var_pop_order_by | null;
  var_samp?: ProjectBadge_var_samp_order_by | null;
  variance?: ProjectBadge_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectBadge"
 */
export interface ProjectBadge_arr_rel_insert_input {
  data: ProjectBadge_insert_input[];
  on_conflict?: ProjectBadge_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_avg_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectBadge". All fields are combined with a logical 'AND'.
 */
export interface ProjectBadge_bool_exp {
  Badge?: Badge_bool_exp | null;
  Project?: Project_bool_exp | null;
  _and?: ProjectBadge_bool_exp[] | null;
  _not?: ProjectBadge_bool_exp | null;
  _or?: ProjectBadge_bool_exp[] | null;
  badgeId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectBadge"
 */
export interface ProjectBadge_insert_input {
  Badge?: Badge_obj_rel_insert_input | null;
  Project?: Project_obj_rel_insert_input | null;
  badgeId?: number | null;
  created_at?: any | null;
  id?: number | null;
  projectId?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_max_order_by {
  badgeId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_min_order_by {
  badgeId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectBadge"
 */
export interface ProjectBadge_on_conflict {
  constraint: ProjectBadge_constraint;
  update_columns: ProjectBadge_update_column[];
  where?: ProjectBadge_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_stddev_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_stddev_pop_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_stddev_samp_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_sum_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_var_pop_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_var_samp_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectBadge"
 */
export interface ProjectBadge_variance_order_by {
  badgeId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

export interface ProjectConsentEvent_aggregate_bool_exp {
  count?: ProjectConsentEvent_aggregate_bool_exp_count | null;
}

export interface ProjectConsentEvent_aggregate_bool_exp_count {
  arguments?: ProjectConsentEvent_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectConsentEvent_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_aggregate_order_by {
  avg?: ProjectConsentEvent_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectConsentEvent_max_order_by | null;
  min?: ProjectConsentEvent_min_order_by | null;
  stddev?: ProjectConsentEvent_stddev_order_by | null;
  stddev_pop?: ProjectConsentEvent_stddev_pop_order_by | null;
  stddev_samp?: ProjectConsentEvent_stddev_samp_order_by | null;
  sum?: ProjectConsentEvent_sum_order_by | null;
  var_pop?: ProjectConsentEvent_var_pop_order_by | null;
  var_samp?: ProjectConsentEvent_var_samp_order_by | null;
  variance?: ProjectConsentEvent_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_arr_rel_insert_input {
  data: ProjectConsentEvent_insert_input[];
  on_conflict?: ProjectConsentEvent_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_avg_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectConsentEvent". All fields are combined with a logical 'AND'.
 */
export interface ProjectConsentEvent_bool_exp {
  ActorUser?: User_bool_exp | null;
  Project?: Project_bool_exp | null;
  _and?: ProjectConsentEvent_bool_exp[] | null;
  _not?: ProjectConsentEvent_bool_exp | null;
  _or?: ProjectConsentEvent_bool_exp[] | null;
  actorUserId?: uuid_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  eventType?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  termsVersion?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_insert_input {
  ActorUser?: User_obj_rel_insert_input | null;
  Project?: Project_obj_rel_insert_input | null;
  actorUserId?: any | null;
  created_at?: any | null;
  eventType?: string | null;
  id?: number | null;
  projectId?: number | null;
  termsVersion?: string | null;
}

/**
 * order by max() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_max_order_by {
  actorUserId?: order_by | null;
  created_at?: order_by | null;
  eventType?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  termsVersion?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_min_order_by {
  actorUserId?: order_by | null;
  created_at?: order_by | null;
  eventType?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  termsVersion?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_on_conflict {
  constraint: ProjectConsentEvent_constraint;
  update_columns: ProjectConsentEvent_update_column[];
  where?: ProjectConsentEvent_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_stddev_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_stddev_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_stddev_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_sum_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_var_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_var_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectConsentEvent"
 */
export interface ProjectConsentEvent_variance_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

export interface ProjectCourse_aggregate_bool_exp {
  count?: ProjectCourse_aggregate_bool_exp_count | null;
}

export interface ProjectCourse_aggregate_bool_exp_count {
  arguments?: ProjectCourse_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectCourse_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectCourse"
 */
export interface ProjectCourse_aggregate_order_by {
  avg?: ProjectCourse_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectCourse_max_order_by | null;
  min?: ProjectCourse_min_order_by | null;
  stddev?: ProjectCourse_stddev_order_by | null;
  stddev_pop?: ProjectCourse_stddev_pop_order_by | null;
  stddev_samp?: ProjectCourse_stddev_samp_order_by | null;
  sum?: ProjectCourse_sum_order_by | null;
  var_pop?: ProjectCourse_var_pop_order_by | null;
  var_samp?: ProjectCourse_var_samp_order_by | null;
  variance?: ProjectCourse_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectCourse"
 */
export interface ProjectCourse_arr_rel_insert_input {
  data: ProjectCourse_insert_input[];
  on_conflict?: ProjectCourse_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_avg_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectCourse". All fields are combined with a logical 'AND'.
 */
export interface ProjectCourse_bool_exp {
  Course?: Course_bool_exp | null;
  Project?: Project_bool_exp | null;
  _and?: ProjectCourse_bool_exp[] | null;
  _not?: ProjectCourse_bool_exp | null;
  _or?: ProjectCourse_bool_exp[] | null;
  courseId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectCourse"
 */
export interface ProjectCourse_insert_input {
  Course?: Course_obj_rel_insert_input | null;
  Project?: Project_obj_rel_insert_input | null;
  courseId?: number | null;
  created_at?: any | null;
  id?: number | null;
  projectId?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_max_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_min_order_by {
  courseId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectCourse"
 */
export interface ProjectCourse_on_conflict {
  constraint: ProjectCourse_constraint;
  update_columns: ProjectCourse_update_column[];
  where?: ProjectCourse_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_stddev_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_stddev_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_stddev_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_sum_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_var_pop_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_var_samp_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectCourse"
 */
export interface ProjectCourse_variance_order_by {
  courseId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

export interface ProjectDocumentationInstruction_aggregate_bool_exp {
  bool_and?: ProjectDocumentationInstruction_aggregate_bool_exp_bool_and | null;
  bool_or?: ProjectDocumentationInstruction_aggregate_bool_exp_bool_or | null;
  count?: ProjectDocumentationInstruction_aggregate_bool_exp_count | null;
}

export interface ProjectDocumentationInstruction_aggregate_bool_exp_bool_and {
  arguments: ProjectDocumentationInstruction_select_column_ProjectDocumentationInstruction_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: ProjectDocumentationInstruction_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface ProjectDocumentationInstruction_aggregate_bool_exp_bool_or {
  arguments: ProjectDocumentationInstruction_select_column_ProjectDocumentationInstruction_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: ProjectDocumentationInstruction_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface ProjectDocumentationInstruction_aggregate_bool_exp_count {
  arguments?: ProjectDocumentationInstruction_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectDocumentationInstruction_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_aggregate_order_by {
  avg?: ProjectDocumentationInstruction_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectDocumentationInstruction_max_order_by | null;
  min?: ProjectDocumentationInstruction_min_order_by | null;
  stddev?: ProjectDocumentationInstruction_stddev_order_by | null;
  stddev_pop?: ProjectDocumentationInstruction_stddev_pop_order_by | null;
  stddev_samp?: ProjectDocumentationInstruction_stddev_samp_order_by | null;
  sum?: ProjectDocumentationInstruction_sum_order_by | null;
  var_pop?: ProjectDocumentationInstruction_var_pop_order_by | null;
  var_samp?: ProjectDocumentationInstruction_var_samp_order_by | null;
  variance?: ProjectDocumentationInstruction_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_arr_rel_insert_input {
  data: ProjectDocumentationInstruction_insert_input[];
  on_conflict?: ProjectDocumentationInstruction_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_avg_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectDocumentationInstruction". All fields are combined with a logical 'AND'.
 */
export interface ProjectDocumentationInstruction_bool_exp {
  CreatedByUser?: User_bool_exp | null;
  ProjectType?: ProjectType_bool_exp | null;
  Projects?: Project_bool_exp | null;
  Projects_aggregate?: Project_aggregate_bool_exp | null;
  _and?: ProjectDocumentationInstruction_bool_exp[] | null;
  _not?: ProjectDocumentationInstruction_bool_exp | null;
  _or?: ProjectDocumentationInstruction_bool_exp[] | null;
  createdByUserId?: uuid_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  isDefault?: Boolean_comparison_exp | null;
  legacyAchievementDocumentationTemplateId?: Int_comparison_exp | null;
  projectTypeValue?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  url?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_insert_input {
  CreatedByUser?: User_obj_rel_insert_input | null;
  ProjectType?: ProjectType_obj_rel_insert_input | null;
  Projects?: Project_arr_rel_insert_input | null;
  createdByUserId?: any | null;
  created_at?: any | null;
  id?: number | null;
  isDefault?: boolean | null;
  legacyAchievementDocumentationTemplateId?: number | null;
  projectTypeValue?: string | null;
  title?: string | null;
  updated_at?: any | null;
  url?: string | null;
}

/**
 * order by max() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_max_order_by {
  createdByUserId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
  projectTypeValue?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  url?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_min_order_by {
  createdByUserId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
  projectTypeValue?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  url?: order_by | null;
}

/**
 * input type for inserting object relation for remote table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_obj_rel_insert_input {
  data: ProjectDocumentationInstruction_insert_input;
  on_conflict?: ProjectDocumentationInstruction_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_on_conflict {
  constraint: ProjectDocumentationInstruction_constraint;
  update_columns: ProjectDocumentationInstruction_update_column[];
  where?: ProjectDocumentationInstruction_bool_exp | null;
}

/**
 * Ordering options when selecting data from "ProjectDocumentationInstruction".
 */
export interface ProjectDocumentationInstruction_order_by {
  CreatedByUser?: User_order_by | null;
  ProjectType?: ProjectType_order_by | null;
  Projects_aggregate?: Project_aggregate_order_by | null;
  createdByUserId?: order_by | null;
  created_at?: order_by | null;
  id?: order_by | null;
  isDefault?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
  projectTypeValue?: order_by | null;
  title?: order_by | null;
  updated_at?: order_by | null;
  url?: order_by | null;
}

/**
 * order by stddev() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_stddev_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_stddev_pop_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_stddev_samp_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_sum_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_var_pop_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_var_samp_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectDocumentationInstruction"
 */
export interface ProjectDocumentationInstruction_variance_order_by {
  id?: order_by | null;
  legacyAchievementDocumentationTemplateId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectGroupOption". All fields are combined with a logical 'AND'.
 */
export interface ProjectGroupOption_bool_exp {
  Organization?: Organization_bool_exp | null;
  ProjectGroups?: ProjectGroup_bool_exp | null;
  ProjectGroups_aggregate?: ProjectGroup_aggregate_bool_exp | null;
  ProjectSliderProjectGroups?: ProjectSliderProjectGroup_bool_exp | null;
  ProjectSliderProjectGroups_aggregate?: ProjectSliderProjectGroup_aggregate_bool_exp | null;
  _and?: ProjectGroupOption_bool_exp[] | null;
  _not?: ProjectGroupOption_bool_exp | null;
  _or?: ProjectGroupOption_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  order?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  title?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectGroupOption"
 */
export interface ProjectGroupOption_insert_input {
  Organization?: Organization_obj_rel_insert_input | null;
  ProjectGroups?: ProjectGroup_arr_rel_insert_input | null;
  ProjectSliderProjectGroups?: ProjectSliderProjectGroup_arr_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  order?: number | null;
  organizationId?: number | null;
  title?: string | null;
  updated_at?: any | null;
}

/**
 * input type for inserting object relation for remote table "ProjectGroupOption"
 */
export interface ProjectGroupOption_obj_rel_insert_input {
  data: ProjectGroupOption_insert_input;
  on_conflict?: ProjectGroupOption_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectGroupOption"
 */
export interface ProjectGroupOption_on_conflict {
  constraint: ProjectGroupOption_constraint;
  update_columns: ProjectGroupOption_update_column[];
  where?: ProjectGroupOption_bool_exp | null;
}

export interface ProjectGroup_aggregate_bool_exp {
  count?: ProjectGroup_aggregate_bool_exp_count | null;
}

export interface ProjectGroup_aggregate_bool_exp_count {
  arguments?: ProjectGroup_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectGroup_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectGroup"
 */
export interface ProjectGroup_aggregate_order_by {
  avg?: ProjectGroup_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectGroup_max_order_by | null;
  min?: ProjectGroup_min_order_by | null;
  stddev?: ProjectGroup_stddev_order_by | null;
  stddev_pop?: ProjectGroup_stddev_pop_order_by | null;
  stddev_samp?: ProjectGroup_stddev_samp_order_by | null;
  sum?: ProjectGroup_sum_order_by | null;
  var_pop?: ProjectGroup_var_pop_order_by | null;
  var_samp?: ProjectGroup_var_samp_order_by | null;
  variance?: ProjectGroup_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectGroup"
 */
export interface ProjectGroup_arr_rel_insert_input {
  data: ProjectGroup_insert_input[];
  on_conflict?: ProjectGroup_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_avg_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectGroup". All fields are combined with a logical 'AND'.
 */
export interface ProjectGroup_bool_exp {
  Project?: Project_bool_exp | null;
  ProjectGroupOption?: ProjectGroupOption_bool_exp | null;
  _and?: ProjectGroup_bool_exp[] | null;
  _not?: ProjectGroup_bool_exp | null;
  _or?: ProjectGroup_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  groupOptionId?: Int_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectGroup"
 */
export interface ProjectGroup_insert_input {
  Project?: Project_obj_rel_insert_input | null;
  ProjectGroupOption?: ProjectGroupOption_obj_rel_insert_input | null;
  created_at?: any | null;
  groupOptionId?: number | null;
  id?: number | null;
  projectId?: number | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_max_order_by {
  created_at?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_min_order_by {
  created_at?: order_by | null;
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectGroup"
 */
export interface ProjectGroup_on_conflict {
  constraint: ProjectGroup_constraint;
  update_columns: ProjectGroup_update_column[];
  where?: ProjectGroup_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_stddev_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_stddev_pop_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_stddev_samp_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_sum_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_var_pop_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_var_samp_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectGroup"
 */
export interface ProjectGroup_variance_order_by {
  groupOptionId?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
}

export interface ProjectMentor_aggregate_bool_exp {
  count?: ProjectMentor_aggregate_bool_exp_count | null;
}

export interface ProjectMentor_aggregate_bool_exp_count {
  arguments?: ProjectMentor_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectMentor_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectMentor"
 */
export interface ProjectMentor_aggregate_order_by {
  avg?: ProjectMentor_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectMentor_max_order_by | null;
  min?: ProjectMentor_min_order_by | null;
  stddev?: ProjectMentor_stddev_order_by | null;
  stddev_pop?: ProjectMentor_stddev_pop_order_by | null;
  stddev_samp?: ProjectMentor_stddev_samp_order_by | null;
  sum?: ProjectMentor_sum_order_by | null;
  var_pop?: ProjectMentor_var_pop_order_by | null;
  var_samp?: ProjectMentor_var_samp_order_by | null;
  variance?: ProjectMentor_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectMentor"
 */
export interface ProjectMentor_arr_rel_insert_input {
  data: ProjectMentor_insert_input[];
  on_conflict?: ProjectMentor_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_avg_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectMentor". All fields are combined with a logical 'AND'.
 */
export interface ProjectMentor_bool_exp {
  Project?: Project_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: ProjectMentor_bool_exp[] | null;
  _not?: ProjectMentor_bool_exp | null;
  _or?: ProjectMentor_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectMentor"
 */
export interface ProjectMentor_insert_input {
  Project?: Project_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  projectId?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * order by max() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_max_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_min_order_by {
  created_at?: order_by | null;
  id?: order_by | null;
  projectId?: order_by | null;
  updated_at?: order_by | null;
  userId?: order_by | null;
}

/**
 * on_conflict condition type for table "ProjectMentor"
 */
export interface ProjectMentor_on_conflict {
  constraint: ProjectMentor_constraint;
  update_columns: ProjectMentor_update_column[];
  where?: ProjectMentor_bool_exp | null;
}

/**
 * order by stddev() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_stddev_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_stddev_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_stddev_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_sum_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_var_pop_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_var_samp_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectMentor"
 */
export interface ProjectMentor_variance_order_by {
  id?: order_by | null;
  projectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectParticipationStatus". All fields are combined with a logical 'AND'.
 */
export interface ProjectParticipationStatus_bool_exp {
  ProjectAuthors?: ProjectAuthor_bool_exp | null;
  ProjectAuthors_aggregate?: ProjectAuthor_aggregate_bool_exp | null;
  _and?: ProjectParticipationStatus_bool_exp[] | null;
  _not?: ProjectParticipationStatus_bool_exp | null;
  _or?: ProjectParticipationStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "ProjectParticipationStatus_enum". All fields are combined with logical 'AND'.
 */
export interface ProjectParticipationStatus_enum_comparison_exp {
  _eq?: ProjectParticipationStatus_enum | null;
  _in?: ProjectParticipationStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: ProjectParticipationStatus_enum | null;
  _nin?: ProjectParticipationStatus_enum[] | null;
}

/**
 * input type for inserting data into table "ProjectParticipationStatus"
 */
export interface ProjectParticipationStatus_insert_input {
  ProjectAuthors?: ProjectAuthor_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "ProjectParticipationStatus"
 */
export interface ProjectParticipationStatus_obj_rel_insert_input {
  data: ProjectParticipationStatus_insert_input;
  on_conflict?: ProjectParticipationStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectParticipationStatus"
 */
export interface ProjectParticipationStatus_on_conflict {
  constraint: ProjectParticipationStatus_constraint;
  update_columns: ProjectParticipationStatus_update_column[];
  where?: ProjectParticipationStatus_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectRating". All fields are combined with a logical 'AND'.
 */
export interface ProjectRating_bool_exp {
  Projects?: Project_bool_exp | null;
  Projects_aggregate?: Project_aggregate_bool_exp | null;
  _and?: ProjectRating_bool_exp[] | null;
  _not?: ProjectRating_bool_exp | null;
  _or?: ProjectRating_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "ProjectRating_enum". All fields are combined with logical 'AND'.
 */
export interface ProjectRating_enum_comparison_exp {
  _eq?: ProjectRating_enum | null;
  _in?: ProjectRating_enum[] | null;
  _is_null?: boolean | null;
  _neq?: ProjectRating_enum | null;
  _nin?: ProjectRating_enum[] | null;
}

/**
 * input type for inserting data into table "ProjectRating"
 */
export interface ProjectRating_insert_input {
  Projects?: Project_arr_rel_insert_input | null;
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
 * Ordering options when selecting data from "ProjectRating".
 */
export interface ProjectRating_order_by {
  Projects_aggregate?: Project_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface ProjectSliderCourseGroup_aggregate_bool_exp {
  count?: ProjectSliderCourseGroup_aggregate_bool_exp_count | null;
}

export interface ProjectSliderCourseGroup_aggregate_bool_exp_count {
  arguments?: ProjectSliderCourseGroup_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectSliderCourseGroup_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "ProjectSliderCourseGroup"
 */
export interface ProjectSliderCourseGroup_arr_rel_insert_input {
  data: ProjectSliderCourseGroup_insert_input[];
  on_conflict?: ProjectSliderCourseGroup_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectSliderCourseGroup". All fields are combined with a logical 'AND'.
 */
export interface ProjectSliderCourseGroup_bool_exp {
  CourseGroupOption?: CourseGroupOption_bool_exp | null;
  ProjectSliderOption?: CourseGroupOption_bool_exp | null;
  _and?: ProjectSliderCourseGroup_bool_exp[] | null;
  _not?: ProjectSliderCourseGroup_bool_exp | null;
  _or?: ProjectSliderCourseGroup_bool_exp[] | null;
  courseGroupOptionId?: Int_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectSliderOptionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectSliderCourseGroup"
 */
export interface ProjectSliderCourseGroup_insert_input {
  CourseGroupOption?: CourseGroupOption_obj_rel_insert_input | null;
  ProjectSliderOption?: CourseGroupOption_obj_rel_insert_input | null;
  courseGroupOptionId?: number | null;
  created_at?: any | null;
  id?: number | null;
  projectSliderOptionId?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "ProjectSliderCourseGroup"
 */
export interface ProjectSliderCourseGroup_on_conflict {
  constraint: ProjectSliderCourseGroup_constraint;
  update_columns: ProjectSliderCourseGroup_update_column[];
  where?: ProjectSliderCourseGroup_bool_exp | null;
}

export interface ProjectSliderProjectGroup_aggregate_bool_exp {
  count?: ProjectSliderProjectGroup_aggregate_bool_exp_count | null;
}

export interface ProjectSliderProjectGroup_aggregate_bool_exp_count {
  arguments?: ProjectSliderProjectGroup_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectSliderProjectGroup_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "ProjectSliderProjectGroup"
 */
export interface ProjectSliderProjectGroup_arr_rel_insert_input {
  data: ProjectSliderProjectGroup_insert_input[];
  on_conflict?: ProjectSliderProjectGroup_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectSliderProjectGroup". All fields are combined with a logical 'AND'.
 */
export interface ProjectSliderProjectGroup_bool_exp {
  ProjectGroupOption?: ProjectGroupOption_bool_exp | null;
  ProjectSliderOption?: CourseGroupOption_bool_exp | null;
  _and?: ProjectSliderProjectGroup_bool_exp[] | null;
  _not?: ProjectSliderProjectGroup_bool_exp | null;
  _or?: ProjectSliderProjectGroup_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  projectGroupOptionId?: Int_comparison_exp | null;
  projectSliderOptionId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectSliderProjectGroup"
 */
export interface ProjectSliderProjectGroup_insert_input {
  ProjectGroupOption?: ProjectGroupOption_obj_rel_insert_input | null;
  ProjectSliderOption?: CourseGroupOption_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  projectGroupOptionId?: number | null;
  projectSliderOptionId?: number | null;
  updated_at?: any | null;
}

/**
 * on_conflict condition type for table "ProjectSliderProjectGroup"
 */
export interface ProjectSliderProjectGroup_on_conflict {
  constraint: ProjectSliderProjectGroup_constraint;
  update_columns: ProjectSliderProjectGroup_update_column[];
  where?: ProjectSliderProjectGroup_bool_exp | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectStatus". All fields are combined with a logical 'AND'.
 */
export interface ProjectStatus_bool_exp {
  Projects?: Project_bool_exp | null;
  Projects_aggregate?: Project_aggregate_bool_exp | null;
  _and?: ProjectStatus_bool_exp[] | null;
  _not?: ProjectStatus_bool_exp | null;
  _or?: ProjectStatus_bool_exp[] | null;
  comment?: String_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * Boolean expression to compare columns of type "ProjectStatus_enum". All fields are combined with logical 'AND'.
 */
export interface ProjectStatus_enum_comparison_exp {
  _eq?: ProjectStatus_enum | null;
  _in?: ProjectStatus_enum[] | null;
  _is_null?: boolean | null;
  _neq?: ProjectStatus_enum | null;
  _nin?: ProjectStatus_enum[] | null;
}

/**
 * input type for inserting data into table "ProjectStatus"
 */
export interface ProjectStatus_insert_input {
  Projects?: Project_arr_rel_insert_input | null;
  comment?: string | null;
  value?: string | null;
}

/**
 * input type for inserting object relation for remote table "ProjectStatus"
 */
export interface ProjectStatus_obj_rel_insert_input {
  data: ProjectStatus_insert_input;
  on_conflict?: ProjectStatus_on_conflict | null;
}

/**
 * on_conflict condition type for table "ProjectStatus"
 */
export interface ProjectStatus_on_conflict {
  constraint: ProjectStatus_constraint;
  update_columns: ProjectStatus_update_column[];
  where?: ProjectStatus_bool_exp | null;
}

/**
 * Ordering options when selecting data from "ProjectStatus".
 */
export interface ProjectStatus_order_by {
  Projects_aggregate?: Project_aggregate_order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

export interface ProjectType_aggregate_bool_exp {
  bool_and?: ProjectType_aggregate_bool_exp_bool_and | null;
  bool_or?: ProjectType_aggregate_bool_exp_bool_or | null;
  count?: ProjectType_aggregate_bool_exp_count | null;
}

export interface ProjectType_aggregate_bool_exp_bool_and {
  arguments: ProjectType_select_column_ProjectType_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: ProjectType_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface ProjectType_aggregate_bool_exp_bool_or {
  arguments: ProjectType_select_column_ProjectType_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: ProjectType_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface ProjectType_aggregate_bool_exp_count {
  arguments?: ProjectType_select_column[] | null;
  distinct?: boolean | null;
  filter?: ProjectType_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "ProjectType"
 */
export interface ProjectType_aggregate_order_by {
  avg?: ProjectType_avg_order_by | null;
  count?: order_by | null;
  max?: ProjectType_max_order_by | null;
  min?: ProjectType_min_order_by | null;
  stddev?: ProjectType_stddev_order_by | null;
  stddev_pop?: ProjectType_stddev_pop_order_by | null;
  stddev_samp?: ProjectType_stddev_samp_order_by | null;
  sum?: ProjectType_sum_order_by | null;
  var_pop?: ProjectType_var_pop_order_by | null;
  var_samp?: ProjectType_var_samp_order_by | null;
  variance?: ProjectType_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "ProjectType"
 */
export interface ProjectType_arr_rel_insert_input {
  data: ProjectType_insert_input[];
  on_conflict?: ProjectType_on_conflict | null;
}

/**
 * order by avg() on columns of table "ProjectType"
 */
export interface ProjectType_avg_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "ProjectType". All fields are combined with a logical 'AND'.
 */
export interface ProjectType_bool_exp {
  CertificateTemplate?: CertificateTemplate_bool_exp | null;
  ProjectDocumentationInstructions?: ProjectDocumentationInstruction_bool_exp | null;
  ProjectDocumentationInstructions_aggregate?: ProjectDocumentationInstruction_aggregate_bool_exp | null;
  Projects?: Project_bool_exp | null;
  Projects_aggregate?: Project_aggregate_bool_exp | null;
  _and?: ProjectType_bool_exp[] | null;
  _not?: ProjectType_bool_exp | null;
  _or?: ProjectType_bool_exp[] | null;
  certificateTemplateId?: Int_comparison_exp | null;
  comment?: String_comparison_exp | null;
  requiresCoverImage?: Boolean_comparison_exp | null;
  requiresDocumentation?: Boolean_comparison_exp | null;
  requiresExternalUrl?: Boolean_comparison_exp | null;
  requiresPresentation?: Boolean_comparison_exp | null;
  value?: String_comparison_exp | null;
}

/**
 * input type for inserting data into table "ProjectType"
 */
export interface ProjectType_insert_input {
  CertificateTemplate?: CertificateTemplate_obj_rel_insert_input | null;
  ProjectDocumentationInstructions?: ProjectDocumentationInstruction_arr_rel_insert_input | null;
  Projects?: Project_arr_rel_insert_input | null;
  certificateTemplateId?: number | null;
  comment?: string | null;
  requiresCoverImage?: boolean | null;
  requiresDocumentation?: boolean | null;
  requiresExternalUrl?: boolean | null;
  requiresPresentation?: boolean | null;
  value?: string | null;
}

/**
 * order by max() on columns of table "ProjectType"
 */
export interface ProjectType_max_order_by {
  certificateTemplateId?: order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
}

/**
 * order by min() on columns of table "ProjectType"
 */
export interface ProjectType_min_order_by {
  certificateTemplateId?: order_by | null;
  comment?: order_by | null;
  value?: order_by | null;
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
 * Ordering options when selecting data from "ProjectType".
 */
export interface ProjectType_order_by {
  CertificateTemplate?: CertificateTemplate_order_by | null;
  ProjectDocumentationInstructions_aggregate?: ProjectDocumentationInstruction_aggregate_order_by | null;
  Projects_aggregate?: Project_aggregate_order_by | null;
  certificateTemplateId?: order_by | null;
  comment?: order_by | null;
  requiresCoverImage?: order_by | null;
  requiresDocumentation?: order_by | null;
  requiresExternalUrl?: order_by | null;
  requiresPresentation?: order_by | null;
  value?: order_by | null;
}

/**
 * order by stddev() on columns of table "ProjectType"
 */
export interface ProjectType_stddev_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "ProjectType"
 */
export interface ProjectType_stddev_pop_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "ProjectType"
 */
export interface ProjectType_stddev_samp_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by sum() on columns of table "ProjectType"
 */
export interface ProjectType_sum_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "ProjectType"
 */
export interface ProjectType_var_pop_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "ProjectType"
 */
export interface ProjectType_var_samp_order_by {
  certificateTemplateId?: order_by | null;
}

/**
 * order by variance() on columns of table "ProjectType"
 */
export interface ProjectType_variance_order_by {
  certificateTemplateId?: order_by | null;
}

export interface Project_aggregate_bool_exp {
  bool_and?: Project_aggregate_bool_exp_bool_and | null;
  bool_or?: Project_aggregate_bool_exp_bool_or | null;
  count?: Project_aggregate_bool_exp_count | null;
}

export interface Project_aggregate_bool_exp_bool_and {
  arguments: Project_select_column_Project_aggregate_bool_exp_bool_and_arguments_columns;
  distinct?: boolean | null;
  filter?: Project_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Project_aggregate_bool_exp_bool_or {
  arguments: Project_select_column_Project_aggregate_bool_exp_bool_or_arguments_columns;
  distinct?: boolean | null;
  filter?: Project_bool_exp | null;
  predicate: Boolean_comparison_exp;
}

export interface Project_aggregate_bool_exp_count {
  arguments?: Project_select_column[] | null;
  distinct?: boolean | null;
  filter?: Project_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * order by aggregate values of table "Project"
 */
export interface Project_aggregate_order_by {
  avg?: Project_avg_order_by | null;
  count?: order_by | null;
  max?: Project_max_order_by | null;
  min?: Project_min_order_by | null;
  stddev?: Project_stddev_order_by | null;
  stddev_pop?: Project_stddev_pop_order_by | null;
  stddev_samp?: Project_stddev_samp_order_by | null;
  sum?: Project_sum_order_by | null;
  var_pop?: Project_var_pop_order_by | null;
  var_samp?: Project_var_samp_order_by | null;
  variance?: Project_variance_order_by | null;
}

/**
 * input type for inserting array relation for remote table "Project"
 */
export interface Project_arr_rel_insert_input {
  data: Project_insert_input[];
  on_conflict?: Project_on_conflict | null;
}

/**
 * order by avg() on columns of table "Project"
 */
export interface Project_avg_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * Boolean expression to filter rows from the table "Project". All fields are combined with a logical 'AND'.
 */
export interface Project_bool_exp {
  ChildProjects?: Project_bool_exp | null;
  ChildProjects_aggregate?: Project_aggregate_bool_exp | null;
  Organization?: Organization_bool_exp | null;
  ParentProject?: Project_bool_exp | null;
  ProjectAuthors?: ProjectAuthor_bool_exp | null;
  ProjectAuthors_aggregate?: ProjectAuthor_aggregate_bool_exp | null;
  ProjectBadges?: ProjectBadge_bool_exp | null;
  ProjectBadges_aggregate?: ProjectBadge_aggregate_bool_exp | null;
  ProjectConsentEvents?: ProjectConsentEvent_bool_exp | null;
  ProjectConsentEvents_aggregate?: ProjectConsentEvent_aggregate_bool_exp | null;
  ProjectCourses?: ProjectCourse_bool_exp | null;
  ProjectCourses_aggregate?: ProjectCourse_aggregate_bool_exp | null;
  ProjectDocumentationInstruction?: ProjectDocumentationInstruction_bool_exp | null;
  ProjectGroups?: ProjectGroup_bool_exp | null;
  ProjectGroups_aggregate?: ProjectGroup_aggregate_bool_exp | null;
  ProjectMentors?: ProjectMentor_bool_exp | null;
  ProjectMentors_aggregate?: ProjectMentor_aggregate_bool_exp | null;
  ProjectRating?: ProjectRating_bool_exp | null;
  ProjectStatus?: ProjectStatus_bool_exp | null;
  ProjectType?: ProjectType_bool_exp | null;
  ProposedByUser?: User_bool_exp | null;
  SubmittedByUser?: User_bool_exp | null;
  _and?: Project_bool_exp[] | null;
  _not?: Project_bool_exp | null;
  _or?: Project_bool_exp[] | null;
  acceptingParticipants?: Boolean_comparison_exp | null;
  coverImageUrl?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  csvResults?: String_comparison_exp | null;
  description?: String_comparison_exp | null;
  documentationInstructionId?: Int_comparison_exp | null;
  documentationUrl?: String_comparison_exp | null;
  externalUrl?: String_comparison_exp | null;
  id?: Int_comparison_exp | null;
  legacyAchievementOptionId?: Int_comparison_exp | null;
  legacyAchievementRecordId?: Int_comparison_exp | null;
  organizationId?: Int_comparison_exp | null;
  parentProjectId?: Int_comparison_exp | null;
  presentationUrl?: String_comparison_exp | null;
  projectReviewRequestedAt?: timestamptz_comparison_exp | null;
  proposedByUserId?: uuid_comparison_exp | null;
  published?: Boolean_comparison_exp | null;
  rating?: ProjectRating_enum_comparison_exp | null;
  ratingComment?: String_comparison_exp | null;
  sentBackAt?: timestamptz_comparison_exp | null;
  status?: ProjectStatus_enum_comparison_exp | null;
  submissionDeadline?: timestamptz_comparison_exp | null;
  submittedAt?: timestamptz_comparison_exp | null;
  submittedBy?: uuid_comparison_exp | null;
  suggestedForPublication?: Boolean_comparison_exp | null;
  tagline?: String_comparison_exp | null;
  title?: String_comparison_exp | null;
  type?: String_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
}

/**
 * input type for inserting data into table "Project"
 */
export interface Project_insert_input {
  ChildProjects?: Project_arr_rel_insert_input | null;
  Organization?: Organization_obj_rel_insert_input | null;
  ParentProject?: Project_obj_rel_insert_input | null;
  ProjectAuthors?: ProjectAuthor_arr_rel_insert_input | null;
  ProjectBadges?: ProjectBadge_arr_rel_insert_input | null;
  ProjectConsentEvents?: ProjectConsentEvent_arr_rel_insert_input | null;
  ProjectCourses?: ProjectCourse_arr_rel_insert_input | null;
  ProjectDocumentationInstruction?: ProjectDocumentationInstruction_obj_rel_insert_input | null;
  ProjectGroups?: ProjectGroup_arr_rel_insert_input | null;
  ProjectMentors?: ProjectMentor_arr_rel_insert_input | null;
  ProjectRating?: ProjectRating_obj_rel_insert_input | null;
  ProjectStatus?: ProjectStatus_obj_rel_insert_input | null;
  ProjectType?: ProjectType_obj_rel_insert_input | null;
  ProposedByUser?: User_obj_rel_insert_input | null;
  SubmittedByUser?: User_obj_rel_insert_input | null;
  acceptingParticipants?: boolean | null;
  coverImageUrl?: string | null;
  created_at?: any | null;
  csvResults?: string | null;
  description?: string | null;
  documentationInstructionId?: number | null;
  documentationUrl?: string | null;
  externalUrl?: string | null;
  id?: number | null;
  legacyAchievementOptionId?: number | null;
  legacyAchievementRecordId?: number | null;
  organizationId?: number | null;
  parentProjectId?: number | null;
  presentationUrl?: string | null;
  projectReviewRequestedAt?: any | null;
  proposedByUserId?: any | null;
  published?: boolean | null;
  rating?: ProjectRating_enum | null;
  ratingComment?: string | null;
  sentBackAt?: any | null;
  status?: ProjectStatus_enum | null;
  submissionDeadline?: any | null;
  submittedAt?: any | null;
  submittedBy?: any | null;
  suggestedForPublication?: boolean | null;
  tagline?: string | null;
  title?: string | null;
  type?: string | null;
  updated_at?: any | null;
}

/**
 * order by max() on columns of table "Project"
 */
export interface Project_max_order_by {
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationInstructionId?: order_by | null;
  documentationUrl?: order_by | null;
  externalUrl?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
  presentationUrl?: order_by | null;
  projectReviewRequestedAt?: order_by | null;
  proposedByUserId?: order_by | null;
  ratingComment?: order_by | null;
  sentBackAt?: order_by | null;
  submissionDeadline?: order_by | null;
  submittedAt?: order_by | null;
  submittedBy?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by min() on columns of table "Project"
 */
export interface Project_min_order_by {
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationInstructionId?: order_by | null;
  documentationUrl?: order_by | null;
  externalUrl?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
  presentationUrl?: order_by | null;
  projectReviewRequestedAt?: order_by | null;
  proposedByUserId?: order_by | null;
  ratingComment?: order_by | null;
  sentBackAt?: order_by | null;
  submissionDeadline?: order_by | null;
  submittedAt?: order_by | null;
  submittedBy?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
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
 * Ordering options when selecting data from "Project".
 */
export interface Project_order_by {
  ChildProjects_aggregate?: Project_aggregate_order_by | null;
  Organization?: Organization_order_by | null;
  ParentProject?: Project_order_by | null;
  ProjectAuthors_aggregate?: ProjectAuthor_aggregate_order_by | null;
  ProjectBadges_aggregate?: ProjectBadge_aggregate_order_by | null;
  ProjectConsentEvents_aggregate?: ProjectConsentEvent_aggregate_order_by | null;
  ProjectCourses_aggregate?: ProjectCourse_aggregate_order_by | null;
  ProjectDocumentationInstruction?: ProjectDocumentationInstruction_order_by | null;
  ProjectGroups_aggregate?: ProjectGroup_aggregate_order_by | null;
  ProjectMentors_aggregate?: ProjectMentor_aggregate_order_by | null;
  ProjectRating?: ProjectRating_order_by | null;
  ProjectStatus?: ProjectStatus_order_by | null;
  ProjectType?: ProjectType_order_by | null;
  ProposedByUser?: User_order_by | null;
  SubmittedByUser?: User_order_by | null;
  acceptingParticipants?: order_by | null;
  coverImageUrl?: order_by | null;
  created_at?: order_by | null;
  csvResults?: order_by | null;
  description?: order_by | null;
  documentationInstructionId?: order_by | null;
  documentationUrl?: order_by | null;
  externalUrl?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
  presentationUrl?: order_by | null;
  projectReviewRequestedAt?: order_by | null;
  proposedByUserId?: order_by | null;
  published?: order_by | null;
  rating?: order_by | null;
  ratingComment?: order_by | null;
  sentBackAt?: order_by | null;
  status?: order_by | null;
  submissionDeadline?: order_by | null;
  submittedAt?: order_by | null;
  submittedBy?: order_by | null;
  suggestedForPublication?: order_by | null;
  tagline?: order_by | null;
  title?: order_by | null;
  type?: order_by | null;
  updated_at?: order_by | null;
}

/**
 * order by stddev() on columns of table "Project"
 */
export interface Project_stddev_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by stddev_pop() on columns of table "Project"
 */
export interface Project_stddev_pop_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by stddev_samp() on columns of table "Project"
 */
export interface Project_stddev_samp_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by sum() on columns of table "Project"
 */
export interface Project_sum_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by var_pop() on columns of table "Project"
 */
export interface Project_var_pop_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by var_samp() on columns of table "Project"
 */
export interface Project_var_samp_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

/**
 * order by variance() on columns of table "Project"
 */
export interface Project_variance_order_by {
  documentationInstructionId?: order_by | null;
  id?: order_by | null;
  legacyAchievementOptionId?: order_by | null;
  legacyAchievementRecordId?: order_by | null;
  organizationId?: order_by | null;
  parentProjectId?: order_by | null;
}

export interface SavedJobPosting_aggregate_bool_exp {
  count?: SavedJobPosting_aggregate_bool_exp_count | null;
}

export interface SavedJobPosting_aggregate_bool_exp_count {
  arguments?: SavedJobPosting_select_column[] | null;
  distinct?: boolean | null;
  filter?: SavedJobPosting_bool_exp | null;
  predicate: Int_comparison_exp;
}

/**
 * input type for inserting array relation for remote table "SavedJobPosting"
 */
export interface SavedJobPosting_arr_rel_insert_input {
  data: SavedJobPosting_insert_input[];
  on_conflict?: SavedJobPosting_on_conflict | null;
}

/**
 * Boolean expression to filter rows from the table "SavedJobPosting". All fields are combined with a logical 'AND'.
 */
export interface SavedJobPosting_bool_exp {
  JobPosting?: JobPosting_bool_exp | null;
  User?: User_bool_exp | null;
  _and?: SavedJobPosting_bool_exp[] | null;
  _not?: SavedJobPosting_bool_exp | null;
  _or?: SavedJobPosting_bool_exp[] | null;
  created_at?: timestamptz_comparison_exp | null;
  id?: Int_comparison_exp | null;
  jobPostingId?: Int_comparison_exp | null;
  updated_at?: timestamptz_comparison_exp | null;
  userId?: uuid_comparison_exp | null;
}

/**
 * input type for inserting data into table "SavedJobPosting"
 */
export interface SavedJobPosting_insert_input {
  JobPosting?: JobPosting_obj_rel_insert_input | null;
  User?: User_obj_rel_insert_input | null;
  created_at?: any | null;
  id?: number | null;
  jobPostingId?: number | null;
  updated_at?: any | null;
  userId?: any | null;
}

/**
 * on_conflict condition type for table "SavedJobPosting"
 */
export interface SavedJobPosting_on_conflict {
  constraint: SavedJobPosting_constraint;
  update_columns: SavedJobPosting_update_column[];
  where?: SavedJobPosting_bool_exp | null;
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
  OrganizationNewsletterSubscriptions?: OrganizationNewsletterSubscription_bool_exp | null;
  OrganizationNewsletterSubscriptions_aggregate?: OrganizationNewsletterSubscription_aggregate_bool_exp | null;
  ProjectAuthors?: ProjectAuthor_bool_exp | null;
  ProjectAuthors_aggregate?: ProjectAuthor_aggregate_bool_exp | null;
  ProjectMentors?: ProjectMentor_bool_exp | null;
  ProjectMentors_aggregate?: ProjectMentor_aggregate_bool_exp | null;
  ProposedProjects?: Project_bool_exp | null;
  ProposedProjects_aggregate?: Project_aggregate_bool_exp | null;
  SessionSpeakers?: SessionSpeaker_bool_exp | null;
  SessionSpeakers_aggregate?: SessionSpeaker_aggregate_bool_exp | null;
  UserOccupation?: UserOccupation_bool_exp | null;
  UserStatus?: UserStatus_bool_exp | null;
  _and?: User_bool_exp[] | null;
  _not?: User_bool_exp | null;
  _or?: User_bool_exp[] | null;
  addressLine1?: String_comparison_exp | null;
  addressLine2?: String_comparison_exp | null;
  anonymousId?: String_comparison_exp | null;
  city?: String_comparison_exp | null;
  country?: String_comparison_exp | null;
  created_at?: timestamptz_comparison_exp | null;
  email?: String_comparison_exp | null;
  externalProfile?: String_comparison_exp | null;
  firstName?: String_comparison_exp | null;
  id?: uuid_comparison_exp | null;
  integerId?: Int_comparison_exp | null;
  lastName?: String_comparison_exp | null;
  matriculationNumber?: String_comparison_exp | null;
  matrixUserHandle?: String_comparison_exp | null;
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
  OrganizationNewsletterSubscriptions?: OrganizationNewsletterSubscription_arr_rel_insert_input | null;
  ProjectAuthors?: ProjectAuthor_arr_rel_insert_input | null;
  ProjectMentors?: ProjectMentor_arr_rel_insert_input | null;
  ProposedProjects?: Project_arr_rel_insert_input | null;
  SessionSpeakers?: SessionSpeaker_arr_rel_insert_input | null;
  UserOccupation?: UserOccupation_obj_rel_insert_input | null;
  UserStatus?: UserStatus_obj_rel_insert_input | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  anonymousId?: string | null;
  city?: string | null;
  country?: string | null;
  created_at?: any | null;
  email?: string | null;
  externalProfile?: string | null;
  firstName?: string | null;
  id?: any | null;
  integerId?: number | null;
  lastName?: string | null;
  matriculationNumber?: string | null;
  matrixUserHandle?: string | null;
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
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  anonymousId?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  matrixUserHandle?: order_by | null;
  organizationId?: order_by | null;
  picture?: order_by | null;
  updated_at?: order_by | null;
  zipCode?: order_by | null;
}

/**
 * order by min() on columns of table "User"
 */
export interface User_min_order_by {
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  anonymousId?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  matrixUserHandle?: order_by | null;
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
  OrganizationNewsletterSubscriptions_aggregate?: OrganizationNewsletterSubscription_aggregate_order_by | null;
  ProjectAuthors_aggregate?: ProjectAuthor_aggregate_order_by | null;
  ProjectMentors_aggregate?: ProjectMentor_aggregate_order_by | null;
  ProposedProjects_aggregate?: Project_aggregate_order_by | null;
  SessionSpeakers_aggregate?: SessionSpeaker_aggregate_order_by | null;
  UserOccupation?: UserOccupation_order_by | null;
  UserStatus?: UserStatus_order_by | null;
  addressLine1?: order_by | null;
  addressLine2?: order_by | null;
  anonymousId?: order_by | null;
  city?: order_by | null;
  country?: order_by | null;
  created_at?: order_by | null;
  email?: order_by | null;
  externalProfile?: order_by | null;
  firstName?: order_by | null;
  id?: order_by | null;
  integerId?: order_by | null;
  lastName?: order_by | null;
  matriculationNumber?: order_by | null;
  matrixUserHandle?: order_by | null;
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
 * Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'.
 */
export interface bigint_comparison_exp {
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
