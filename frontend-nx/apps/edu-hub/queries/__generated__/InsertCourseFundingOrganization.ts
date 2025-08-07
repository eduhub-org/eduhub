/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseFundingOrganization
// ====================================================

export interface InsertCourseFundingOrganization_insert_CourseFundingOrganization_returning {
  __typename: "CourseFundingOrganization";
  id: number;
}

export interface InsertCourseFundingOrganization_insert_CourseFundingOrganization {
  __typename: "CourseFundingOrganization_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertCourseFundingOrganization_insert_CourseFundingOrganization_returning[];
}

export interface InsertCourseFundingOrganization {
  /**
   * insert data into the table: "CourseFundingOrganization"
   */
  insert_CourseFundingOrganization: InsertCourseFundingOrganization_insert_CourseFundingOrganization | null;
}

export interface InsertCourseFundingOrganizationVariables {
  courseId: number;
  organizationId: number;
}
