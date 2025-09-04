/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionAddressLocation
// ====================================================

export interface UpdateSessionAddressLocation_update_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
  /**
   * Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.
   */
  locationAddressId: number | null;
}

export interface UpdateSessionAddressLocation {
  /**
   * update single row of the table: "SessionAddress"
   */
  update_SessionAddress_by_pk: UpdateSessionAddressLocation_update_SessionAddress_by_pk | null;
}

export interface UpdateSessionAddressLocationVariables {
  itemId: number;
  locationAddressId?: number | null;
}
