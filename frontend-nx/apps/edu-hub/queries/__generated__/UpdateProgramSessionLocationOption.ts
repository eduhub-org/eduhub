/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProgramSessionLocationOption
// ====================================================

export interface UpdateProgramSessionLocationOption_update_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
  /**
   * Location option of a program session address (course session addresses use courseLocationId instead)
   */
  locationOption: LocationOption_enum | null;
}

export interface UpdateProgramSessionLocationOption {
  /**
   * update single row of the table: "SessionAddress"
   */
  update_SessionAddress_by_pk: UpdateProgramSessionLocationOption_update_SessionAddress_by_pk | null;
}

export interface UpdateProgramSessionLocationOptionVariables {
  itemId: number;
  value: LocationOption_enum;
}
