/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationDescription
// ====================================================

export interface UpdateOrganizationDescription_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  description: string | null;
}

export interface UpdateOrganizationDescription {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationDescription_update_Organization_by_pk | null;
}

export interface UpdateOrganizationDescriptionVariables {
  itemId: number;
  text: string;
}
