/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Organization_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OrganizationOptions
// ====================================================

export interface OrganizationOptions_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  aliases: any | null;
}

export interface OrganizationOptions {
  /**
   * fetch data from the table: "Organization"
   */
  Organization: OrganizationOptions_Organization[];
}

export interface OrganizationOptionsVariables {
  limit?: number | null;
  order_by?: Organization_order_by[] | null;
}
