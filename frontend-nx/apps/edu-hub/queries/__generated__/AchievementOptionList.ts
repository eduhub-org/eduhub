/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_bool_exp, AchievementOption_order_by, AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionList
// ====================================================

export interface AchievementOptionList_AchievementOption_AchievementOptionTemplate {
  __typename: "AchievementDocumentationTemplate";
  title: string;
  url: string;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionCourses_Course_Program {
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
}

export interface AchievementOptionList_AchievementOption_AchievementOptionCourses_Course {
  __typename: "Course";
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: AchievementOptionList_AchievementOption_AchievementOptionCourses_Course_Program;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  id: number;
  /**
   * ID of a course for which this achievement optoin can be selected to provided an achievement record.
   */
  courseId: number;
  /**
   * An object relationship
   */
  Course: AchievementOptionList_AchievementOption_AchievementOptionCourses_Course;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors_User {
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
   * The user's email address
   */
  email: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
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
  Organization: AchievementOptionList_AchievementOption_AchievementOptionMentors_User_Organization | null;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors {
  __typename: "AchievementOptionMentor";
  id: number;
  /**
   * An object relationship
   */
  User: AchievementOptionList_AchievementOption_AchievementOptionMentors_User;
}

export interface AchievementOptionList_AchievementOption {
  __typename: "AchievementOption";
  id: number;
  /**
   * Title of an offered achievement option
   */
  title: string;
  /**
   * Description of an offered achievement option
   */
  description: string | null;
  /**
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
  /**
   * If the record tye is "DOCUMENTATION_AND_CSV" an URL to a python script can be provided that returns a score for uploaded csv data.
   */
  evaluationScriptUrl: string | null;
  achievementDocumentationTemplateId: number | null;
  /**
   * An object relationship
   */
  AchievementOptionTemplate: AchievementOptionList_AchievementOption_AchievementOptionTemplate | null;
  /**
   * An array relationship
   */
  AchievementOptionCourses: AchievementOptionList_AchievementOption_AchievementOptionCourses[];
  /**
   * An array relationship
   */
  AchievementOptionMentors: AchievementOptionList_AchievementOption_AchievementOptionMentors[];
}

export interface AchievementOptionList_AchievementOption_aggregate_aggregate {
  __typename: "AchievementOption_aggregate_fields";
  count: number;
}

export interface AchievementOptionList_AchievementOption_aggregate {
  __typename: "AchievementOption_aggregate";
  aggregate: AchievementOptionList_AchievementOption_aggregate_aggregate | null;
}

export interface AchievementOptionList {
  /**
   * fetch data from the table: "AchievementOption"
   */
  AchievementOption: AchievementOptionList_AchievementOption[];
  /**
   * fetch aggregated fields from the table: "AchievementOption"
   */
  AchievementOption_aggregate: AchievementOptionList_AchievementOption_aggregate;
}

export interface AchievementOptionListVariables {
  where: AchievementOption_bool_exp;
  limit?: number | null;
  offset?: number | null;
  order_by?: AchievementOption_order_by[] | null;
}
