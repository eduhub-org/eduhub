/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectGroupOption
// ====================================================

export interface InsertProjectGroupOption_insert_ProjectGroupOption_one {
  __typename: "ProjectGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface InsertProjectGroupOption {
  insert_ProjectGroupOption_one: InsertProjectGroupOption_insert_ProjectGroupOption_one | null;
}

export interface InsertProjectGroupOptionVariables {
  title: string;
  order: number;
}
