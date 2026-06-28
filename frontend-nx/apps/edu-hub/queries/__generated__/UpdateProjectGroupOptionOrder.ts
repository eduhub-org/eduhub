/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectGroupOptionOrder
// ====================================================

export interface UpdateProjectGroupOptionOrder_update_ProjectGroupOption_by_pk {
  __typename: "ProjectGroupOption";
  id: number;
  order: number;
}

export interface UpdateProjectGroupOptionOrder {
  update_ProjectGroupOption_by_pk: UpdateProjectGroupOptionOrder_update_ProjectGroupOption_by_pk | null;
}

export interface UpdateProjectGroupOptionOrderVariables {
  id: number;
  order: number;
}
