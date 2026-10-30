/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseEnrollmentStatusesOfUsers
// ====================================================

export interface CourseEnrollmentStatusesOfUsers_CourseEnrollment {
  __typename: "CourseEnrollment";
  id: number;
  userId: any;
  status: CourseEnrollmentStatus_enum;
}

export interface CourseEnrollmentStatusesOfUsers {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: CourseEnrollmentStatusesOfUsers_CourseEnrollment[];
}

export interface CourseEnrollmentStatusesOfUsersVariables {
  courseId: number;
  userIds: any[];
}
