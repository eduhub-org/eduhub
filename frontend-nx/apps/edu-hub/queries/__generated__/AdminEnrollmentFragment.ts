/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum, MotivationRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: AdminEnrollmentFragment
// ====================================================

export interface AdminEnrollmentFragment {
  __typename: "CourseEnrollment";
  /**
   * The last day a user can confirm his/her invitation to the given course
   */
  invitationExpirationDate: any | null;
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * The text of the user's motivation letter
   */
  motivationLetter: string;
  /**
   * Rating that the user's motivation letter received from the course instructor
   */
  motivationRating: MotivationRating_enum;
}
