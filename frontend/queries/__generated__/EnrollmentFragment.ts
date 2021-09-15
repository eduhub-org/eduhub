/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: EnrollmentFragment
// ====================================================

export interface EnrollmentFragment {
  __typename: "Enrollment";
  /**
   * The last day a user can confirm his/her invitation to the given course
   */
  invitationExpirationDate: any | null;
  id: number;
  /**
   * The user's current enrollment status to this course
   */
  status: EnrollmentStatus_enum;
}
