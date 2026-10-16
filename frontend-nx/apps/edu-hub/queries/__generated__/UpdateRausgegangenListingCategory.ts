/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RausgegangenEventCategory_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateRausgegangenListingCategory
// ====================================================

export interface UpdateRausgegangenListingCategory_update_RausgegangenListing_by_pk {
  __typename: "RausgegangenListing";
  id: number;
  category: RausgegangenEventCategory_enum;
}

export interface UpdateRausgegangenListingCategory {
  /**
   * update single row of the table: "RausgegangenListing"
   */
  update_RausgegangenListing_by_pk: UpdateRausgegangenListingCategory_update_RausgegangenListing_by_pk | null;
}

export interface UpdateRausgegangenListingCategoryVariables {
  id: number;
  value: RausgegangenEventCategory_enum;
}
