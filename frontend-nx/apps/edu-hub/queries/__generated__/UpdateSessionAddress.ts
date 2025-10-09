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
  /**
   * Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.
   */
  locationAddressId: number | null;
}

export interface UpdateSessionAddress {
  /**
   * update single row of the table: "SessionAddress"
   */
  update_SessionAddress_by_pk: UpdateSessionAddress_update_SessionAddress_by_pk | null;
}

export interface UpdateSessionAddressVariables {
  itemId: number;
  value?: number | null;
}
