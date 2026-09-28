/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionDescription
// ====================================================

export interface UpdateSessionDescription_update_Session_by_pk {
  __typename: "Session";
  id: number;
  /**
   * A description of the session
   */
  description: string;
}

export interface UpdateSessionDescription {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionDescription_update_Session_by_pk | null;
}

export interface UpdateSessionDescriptionVariables {
  itemId: number;
  text: string;
}
