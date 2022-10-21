/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_bool_exp, AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionList
// ====================================================

export interface AchievementOptionList_AchievementOption_AchievementOptionCourses_Course_Program {
  __typename: "Program";
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
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
  Program: AchievementOptionList_AchievementOption_AchievementOptionCourses_Course_Program | null;
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

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors_Expert_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  id: any;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors_Expert {
  __typename: "Expert";
  /**
   * An object relationship
   */
  User: AchievementOptionList_AchievementOption_AchievementOptionMentors_Expert_User;
}

export interface AchievementOptionList_AchievementOption_AchievementOptionMentors {
  __typename: "AchievementOptionMentor";
  id: number;
  /**
   * ID of an expert thaht is mentor for an achievement option.
   */
  expertId: number;
  /**
   * An object relationship
   */
  Expert: AchievementOptionList_AchievementOption_AchievementOptionMentors_Expert;
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
}
