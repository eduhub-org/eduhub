/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseSessionLocation
// ====================================================

export interface DeleteCourseSessionLocation_delete_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
}

export interface DeleteCourseSessionLocation {
  /**
   * delete single row from the table: "SessionAddress"
   */
  delete_SessionAddress_by_pk: DeleteCourseSessionLocation_delete_SessionAddress_by_pk | null;
}

export interface DeleteCourseSessionLocationVariables {
  addressId: number;
}
