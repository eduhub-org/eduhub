/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionAddress
// ====================================================

export interface UpdateSessionAddress_update_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
}

export interface UpdateSessionAddress {
  /**
   * update single row of the table: "SessionAddress"
   */
  update_SessionAddress_by_pk: UpdateSessionAddress_update_SessionAddress_by_pk | null;
}

export interface UpdateSessionAddressVariables {
  itemId: number;
  text: string;
}
