/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseFundingOrganization
// ====================================================

export interface DeleteCourseFundingOrganization_delete_CourseFundingOrganization {
  __typename: "CourseFundingOrganization_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteCourseFundingOrganization {
  /**
   * delete data from the table: "CourseFundingOrganization"
   */
  delete_CourseFundingOrganization: DeleteCourseFundingOrganization_delete_CourseFundingOrganization | null;
}

export interface DeleteCourseFundingOrganizationVariables {
  courseId: number;
  organizationId: number;
}
