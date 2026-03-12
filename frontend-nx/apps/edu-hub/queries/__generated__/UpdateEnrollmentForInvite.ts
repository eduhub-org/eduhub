/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentForInvite
// ====================================================

export interface UpdateEnrollmentForInvite_update_CourseEnrollment_by_pk {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentForInvite {
  /**
   * update single row of the table: "CourseEnrollment"
   */
  update_CourseEnrollment_by_pk: UpdateEnrollmentForInvite_update_CourseEnrollment_by_pk | null;
}

export interface UpdateEnrollmentForInviteVariables {
  enrollmentId: number;
  expire: any;
}
