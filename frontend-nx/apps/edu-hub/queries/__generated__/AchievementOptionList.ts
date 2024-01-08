/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_bool_exp, AchievementOption_order_by, AchievementRecordType_enum, University_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionList
// ====================================================

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
   * The deadline for the achievement record uploads.
   */
  achievementRecordUploadDeadline: any | null;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
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
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
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
  /**
   * URL to the template that shall be used for uploading csv data for a new achievement record
   */
  csvTemplateUrl: string | null;
  /**
   * For TRUE the score table will include a column showing the authors; for FALSE the scores will be anonymous.
   */
  showScoreAuthors: boolean | null;
  achievementDocumentationTemplateId: number | null;
  /**
   * An array relationship
   */
  AchievementOptionCourses: AchievementOptionList_AchievementOption_AchievementOptionCourses[];
  /**
   * An array relationship
   */
  AchievementOptionMentors: AchievementOptionList_AchievementOption_AchievementOptionMentors[];
}

export interface AchievementOptionList {
  /**
   * fetch data from the table: "AchievementOption"
   */
  AchievementOption: AchievementOptionList_AchievementOption[];
}

export interface AchievementOptionListVariables {
  where: AchievementOption_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementOption_order_by | null;
}
