/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyTestEnrollment
// ====================================================

export interface MyTestEnrollment_CourseEnrollment {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * Preview enrollment an instructor or admin created on their own course to see the participant view. Never counted, listed, exported, certified or mailed about.
   */
  isTest: boolean;
}

export interface MyTestEnrollment {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: MyTestEnrollment_CourseEnrollment[];
}

export interface MyTestEnrollmentVariables {
  courseId: number;
  userId: any;
}
