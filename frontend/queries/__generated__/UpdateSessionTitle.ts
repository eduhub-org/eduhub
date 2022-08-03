/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionTitle
// ====================================================

export interface UpdateSessionTitle_update_Session_by_pk {
  __typename: "Session";
  id: number;
}

export interface UpdateSessionTitle {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionTitle_update_Session_by_pk | null;
}

export interface UpdateSessionTitleVariables {
  sessionId: number;
  title: string;
}
