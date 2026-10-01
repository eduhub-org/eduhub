/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OrgAdminManageableCourse
// ====================================================

export interface OrgAdminManageableCourse_Course_CourseInstructors_User {
  __typename: "User";
  id: any;
}

export interface OrgAdminManageableCourse_Course_CourseInstructors {
  __typename: "CourseInstructor";
  /**
   * An object relationship
   */
  User: OrgAdminManageableCourse_Course_CourseInstructors_User;
}

export interface OrgAdminManageableCourse_Course {
  __typename: "Course";
  id: number;
  /**
   * An array relationship
   */
  CourseInstructors: OrgAdminManageableCourse_Course_CourseInstructors[];
}

export interface OrgAdminManageableCourse {
  /**
   * fetch data from the table: "Course"
   */
  Course: OrgAdminManageableCourse_Course[];
}

export interface OrgAdminManageableCourseVariables {
  where: Course_bool_exp;
}
