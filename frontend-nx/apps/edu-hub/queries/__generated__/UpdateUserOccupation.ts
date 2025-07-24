/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserOccupation_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateUserOccupation
// ====================================================

export interface UpdateUserOccupation_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * Provides the users occupation status.
   */
  occupation: UserOccupation_enum | null;
}

export interface UpdateUserOccupation {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserOccupation_update_User_by_pk | null;
}

export interface UpdateUserOccupationVariables {
  userId: any;
  value?: UserOccupation_enum | null;
}
