/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: VerifyOrganizationAdminClaim
// ====================================================

export interface VerifyOrganizationAdminClaim_update_OrganizationAdmin_returning {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * How this grant was obtained, NULL when a person granted it. Server-controlled: written by the claimJobOrganization action only, never by a client, since the value is what tells a reviewer whether the claim needs checking.
   */
  claimVerification: string | null;
}

export interface VerifyOrganizationAdminClaim_update_OrganizationAdmin {
  __typename: "OrganizationAdmin_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: VerifyOrganizationAdminClaim_update_OrganizationAdmin_returning[];
}

export interface VerifyOrganizationAdminClaim {
  /**
   * update data of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin: VerifyOrganizationAdminClaim_update_OrganizationAdmin | null;
}

export interface VerifyOrganizationAdminClaimVariables {
  id: number;
}
