/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollment_bool_exp, CourseEnrollmentStatus_enum, MotivationRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourseApplicationRecipients
// ====================================================

export interface ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_User {
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
}

export interface ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * Rating that the user's motivation letter received from the course instructor
   */
  motivationRating: MotivationRating_enum;
  /**
   * An object relationship
   */
  User: ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_User;
}

export interface ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_aggregate_aggregate {
  __typename: "CourseEnrollment_aggregate_fields";
  count: number;
}

export interface ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_aggregate {
  __typename: "CourseEnrollment_aggregate";
  aggregate: ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_aggregate_aggregate | null;
}

export interface ManagedCourseApplicationRecipients_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments[];
  /**
   * An aggregate relationship
   */
  CourseEnrollments_aggregate: ManagedCourseApplicationRecipients_Course_by_pk_CourseEnrollments_aggregate;
}

export interface ManagedCourseApplicationRecipients {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: ManagedCourseApplicationRecipients_Course_by_pk | null;
}

export interface ManagedCourseApplicationRecipientsVariables {
  id: number;
  limit: number;
  filter?: CourseEnrollment_bool_exp | null;
}
