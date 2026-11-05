/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteHomeSliderOrganization
// ====================================================

export interface DeleteHomeSliderOrganization_delete_HomeSliderOrganization_by_pk {
  __typename: "HomeSliderOrganization";
  id: number;
}

export interface DeleteHomeSliderOrganization {
  /**
   * delete single row from the table: "HomeSliderOrganization"
   */
  delete_HomeSliderOrganization_by_pk: DeleteHomeSliderOrganization_delete_HomeSliderOrganization_by_pk | null;
}

export interface DeleteHomeSliderOrganizationVariables {
  id: number;
}
