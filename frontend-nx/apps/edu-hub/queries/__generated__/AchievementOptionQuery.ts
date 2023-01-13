/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_bool_exp, AchievementOption_order_by, AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionQuery
// ====================================================

export interface AchievementOptionQuery_AchievementOption_AchievementOptionCourses_Course_Program {
  __typename: "Program";
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  id: number;
}

export interface AchievementOptionQuery_AchievementOption_AchievementOptionCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: AchievementOptionQuery_AchievementOption_AchievementOptionCourses_Course_Program | null;
}

export interface AchievementOptionQuery_AchievementOption_AchievementOptionCourses {
  __typename: "AchievementOptionCourse";
  /**
   * An object relationship
   */
  Course: AchievementOptionQuery_AchievementOption_AchievementOptionCourses_Course;
}

export interface AchievementOptionQuery_AchievementOption_AchievementOptionMentors_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  id: any;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface AchievementOptionQuery_AchievementOption_AchievementOptionMentors {
  __typename: "AchievementOptionMentor";
  /**
   * An object relationship
   */
  User: AchievementOptionQuery_AchievementOption_AchievementOptionMentors_User;
}

export interface AchievementOptionQuery_AchievementOption_AchievementRecords_AchievementRecordAuthors_User {
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
}

export interface AchievementOptionQuery_AchievementOption_AchievementRecords_AchievementRecordAuthors {
  __typename: "AchievementRecordAuthor";
  /**
   * An object relationship
   */
  User: AchievementOptionQuery_AchievementOption_AchievementRecords_AchievementRecordAuthors_User;
}

export interface AchievementOptionQuery_AchievementOption_AchievementRecords {
  __typename: "AchievementRecord";
  /**
   * Score calculated for possibly uploaded csv data.
   */
  score: any;
  created_at: any | null;
  /**
   * An array relationship
   */
  AchievementRecordAuthors: AchievementOptionQuery_AchievementOption_AchievementRecords_AchievementRecordAuthors[];
}

export interface AchievementOptionQuery_AchievementOption {
  __typename: "AchievementOption";
  /**
   * URL to the template that shall be used for uploading csv data for a new achievement record
   */
  csvTemplateUrl: string | null;
  /**
   * Description of an offered achievement option
   */
  description: string;
  /**
   * An instructor or project mentor can provide a template for the record that must be uploaded to complete this achievement
   */
  documentationTemplateUrl: string;
  /**
   * If the record tye is "DOCUMENTATION_AND_CSV" an URL to a python script can be provided that returns a score for uploaded csv data.
   */
  evaluationScriptUrl: string;
  /**
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
  /**
   * Title of an offered achievement option
   */
  title: string;
  /**
   * An array relationship
   */
  AchievementOptionCourses: AchievementOptionQuery_AchievementOption_AchievementOptionCourses[];
  /**
   * An array relationship
   */
  AchievementOptionMentors: AchievementOptionQuery_AchievementOption_AchievementOptionMentors[];
  /**
   * An array relationship
   */
  AchievementRecords: AchievementOptionQuery_AchievementOption_AchievementRecords[];
}

export interface AchievementOptionQuery {
  /**
   * fetch data from the table: "AchievementOption"
   */
  AchievementOption: AchievementOptionQuery_AchievementOption[];
}

export interface AchievementOptionQueryVariables {
  where: AchievementOption_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementOption_order_by | null;
}
