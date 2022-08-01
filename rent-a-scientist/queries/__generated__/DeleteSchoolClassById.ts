/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteSchoolClassById
// ====================================================

export interface DeleteSchoolClassById_delete_SchoolClass_by_pk {
  __typename: "SchoolClass";
  id: number;
}

export interface DeleteSchoolClassById {
  /**
   * delete single row from the table: "SchoolClass"
   */
  delete_SchoolClass_by_pk: DeleteSchoolClassById_delete_SchoolClass_by_pk | null;
}

export interface DeleteSchoolClassByIdVariables {
  id: number;
}
