/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Weekday_enum, CourseRegistrationType_enum, LocationOption_enum, OrganizationType_enum, CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourse
// ====================================================

export interface ManagedCourse_Course_by_pk_Sessions_SessionAddresses_CourseLocation {
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

export interface ManagedCourse_Course_by_pk_Sessions_SessionAddresses {
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
   * An object relationship
   */
  CourseLocation: ManagedCourse_Course_by_pk_Sessions_SessionAddresses_CourseLocation | null;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_User {
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
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
  /**
   * The user's country of residence
   */
  country: string | null;
  /**
   * An object relationship
   */
  Organization: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_User_Organization | null;
}

export interface ManagedCourse_Course_by_pk_Sessions_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  User: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers_User;
}

export interface ManagedCourse_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The title of the session
   */
  title: string;
  /**
   * An array relationship
   */
  SessionAddresses: ManagedCourse_Course_by_pk_Sessions_SessionAddresses[];
  /**
   * An array relationship
   */
  SessionSpeakers: ManagedCourse_Course_by_pk_Sessions_SessionSpeakers[];
  /**
   * JSON string including all recorded participations for the session (also those that were not matched to registered participants)
   */
  attendanceData: string | null;
}

export interface ManagedCourse_Course_by_pk_CourseInstructors_User {
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
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The user's email address
   */
  email: string;
}

export interface ManagedCourse_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  User: ManagedCourse_Course_by_pk_CourseInstructors_User;
}

export interface ManagedCourse_Course_by_pk_CourseLocations {
  __typename: "CourseLocation";
  id: number;
  /**
   * Will be used as default for any new session address.
   */
  defaultSessionAddress: string | null;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
  /**
   * References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.
   */
  defaultSessionAddressId: number | null;
}

export interface ManagedCourse_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
  /**
   * The default application deadline for a course. It can be changed on the course level.
   */
  defaultApplicationEnd: any | null;
  /**
   * Controls whether course tiles should show an extended application period banner after the program deadline has passed while individual course deadlines are still open.
   */
  showExtendedApplicationPeriodBanner: boolean;
  /**
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Program-wide default for the project submission deadline. Used when a course does not set its own Course.projectSubmissionDeadline. Backfilled from the deprecated Program.achievementRecordUploadDeadline column, which will be dropped in Step 2.
   */
  defaultProjectSubmissionDeadline: any | null;
  /**
   * Default Project.type value applied to projects that originate in courses of this program. Students never pick the type; it is finalized by the instructor at the PROPOSED to ONGOING transition.
   */
  defaultProjectType: string | null;
  /**
   * Default value for Course.projectProposalsEnabled within this program. Controls whether course participants can propose new projects when the course also has achievementCertificatePossible enabled.
   */
  projectProposalsEnabledByDefault: boolean;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  type: string;
  /**
   * Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.
   */
  defaultFormbricksEnrollmentSurveyUrl: string | null;
  matrixSpaceId: string | null;
  /**
   * Matrix room id for the program-wide instructor Element chat (!room:server); invites are sent via admin API.
   */
  matrixInstructorRoomId: string | null;
}

export interface ManagedCourse_Course_by_pk_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface ManagedCourse_Course_by_pk_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  /**
   * An object relationship
   */
  CourseGroupOption: ManagedCourse_Course_by_pk_CourseGroups_CourseGroupOption;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * An object relationship
   */
  Program: ManagedCourse_Course_by_pk_DegreeCourses_Course_Program;
}

export interface ManagedCourse_Course_by_pk_DegreeCourses {
  __typename: "CourseDegree";
  id: number;
  /**
   * ID of the course which is assigned to a degree
   */
  courseId: number;
  /**
   * An object relationship
   */
  Course: ManagedCourse_Course_by_pk_DegreeCourses_Course;
}

export interface ManagedCourse_Course_by_pk_CourseFundingOrganizations_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  description: string | null;
  type: OrganizationType_enum;
  /**
   * Path to the organization logo image file
   */
  logo: string | null;
}

export interface ManagedCourse_Course_by_pk_CourseFundingOrganizations {
  __typename: "CourseFundingOrganization";
  id: number;
  /**
   * An object relationship
   */
  Organization: ManagedCourse_Course_by_pk_CourseFundingOrganizations_Organization;
}

export interface ManagedCourse_Course_by_pk_CourseAddonMappings {
  __typename: "CourseAddonMapping";
  id: number;
  description: string;
  /**
   * Admin-validated price (in cents), can override extracted price
   */
  validatedPrice: number;
  currency: string;
}

export interface ManagedCourse_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * Minimum number of ECTS a participant must have collected from this degree's member courses (CourseDegree.degreeCourseId = this course) before a degree certificate can be generated. Only member enrollments carrying an achievementCertificateURL count, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = 'DEGREES'. NULL = requirement not checked.
   */
  requiredEcts: any | null;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The day of the week the course takes place.
   */
  weekDay: Weekday_enum;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string | null;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The link to the chat of the course (e.g. a mattermost channel)
   */
  chatLink: string | null;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course
   */
  achievementCertificatePossible: boolean;
  /**
   * Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)
   */
  attendanceCertificatePossible: boolean;
  /**
   * Per-course override of Program.projectProposalsEnabledByDefault. When NULL, the program default applies. Only effective when achievementCertificatePossible = true.
   */
  projectProposalsEnabled: boolean | null;
  /**
   * Per-course override for the project submission deadline. When NULL, Program.defaultProjectSubmissionDeadline applies.
   */
  projectSubmissionDeadline: any | null;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number;
  /**
   * The number of maximum participants in the course.
   */
  maxParticipants: number | null;
  /**
   * A computed field, executes function "course_active_participant_count"
   */
  activeParticipantCount: any | null;
  /**
   * An array of texts including the learning goals for the course
   */
  learningGoals: string | null;
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
  /**
   * URL to direct users to an appropriate registration page outside of the application. The internal registration is only used if this field is null.
   */
  externalRegistrationLink: string | null;
  registrationType: CourseRegistrationType_enum | null;
  /**
   * Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.
   */
  formbricksEnrollmentSurveyUrl: string | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * An array relationship
   */
  Sessions: ManagedCourse_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: ManagedCourse_Course_by_pk_CourseInstructors[];
  /**
   * An array relationship
   */
  CourseLocations: ManagedCourse_Course_by_pk_CourseLocations[];
  /**
   * An object relationship
   */
  Program: ManagedCourse_Course_by_pk_Program;
  /**
   * An array relationship
   */
  CourseGroups: ManagedCourse_Course_by_pk_CourseGroups[];
  /**
   * An array relationship
   */
  DegreeCourses: ManagedCourse_Course_by_pk_DegreeCourses[];
  /**
   * An array relationship
   */
  CourseFundingOrganizations: ManagedCourse_Course_by_pk_CourseFundingOrganizations[];
  /**
   * Base price in cents (e.g., 5000 = €50.00)
   */
  basePrice: number | null;
  /**
   * Currency code (EUR, USD, etc.)
   */
  currency: string | null;
  /**
   * An array relationship
   */
  CourseAddonMappings: ManagedCourse_Course_by_pk_CourseAddonMappings[];
  /**
   * Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page
   */
  status: CourseStatus_enum;
  /**
   * Minimum number of this degree's member courses in an EVENTS program the participant must be enrolled in before a degree certificate can be generated. Enrollment alone counts, no certificate required, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = 'DEGREES'. NULL = requirement not checked.
   */
  requiredEventCount: number | null;
  matrixRoomId: string | null;
  /**
   * Stripe Product ID for the base course price
   */
  stripeProductId: string | null;
  /**
   * Stripe Price ID for the base course price
   */
  stripePriceId: string | null;
}

export interface ManagedCourse {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: ManagedCourse_Course_by_pk | null;
}

export interface ManagedCourseVariables {
  id: number;
}
