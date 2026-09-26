/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramSessionOnlineLink
// ====================================================

export interface UpdateProgramSessionOnlineLink_update_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
  /**
   * Where the session will take place; might be an offline or online location which is provided according to the provided type
   */
  address: string;
}

export interface UpdateProgramSessionOnlineLink {
  /**
   * update single row of the table: "SessionAddress"
   */
  update_SessionAddress_by_pk: UpdateProgramSessionOnlineLink_update_SessionAddress_by_pk | null;
}

export interface UpdateProgramSessionOnlineLinkVariables {
  itemId: number;
  text: string;
}
