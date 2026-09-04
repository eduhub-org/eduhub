/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Organization_bool_exp, Organization_order_by, OrganizationType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OrganizationList
// ====================================================

export interface OrganizationList_Organization_Settings {
  __typename: "OrganizationSettings";
  id: number | null;
  /**
   * SHA-256 hash of the organization API key for participant data access. Plain text keys are never stored.
   */
  apiKeyHash: string | null;
  /**
   * Flag indicating whether an encrypted Ghost newsletter API credential is configured.
   */
  ghostNewsletterApiKeyConfigured: boolean | null;
}

export interface OrganizationList_Organization_Users {
  __typename: "User";
  id: any;
}

export interface OrganizationList_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  type: OrganizationType_enum;
  description: string | null;
  aliases: any | null;
  /**
   * Path to the organization logo image file
   */
  logo: string | null;
  /**
   * Short organization newsletter description shown to participants in onboarding and profile preferences.
   */
  newsletterDescription: string | null;
  /**
   * Newsletter provider for this organization. Currently only GHOST is supported.
   */
  newsletterProvider: string;
  /**
   * Ghost members API URL used to synchronize newsletter subscriptions.
   */
  ghostNewsletterApiUrl: string | null;
  /**
   * Optional Ghost newsletter list identifier.
   */
  ghostNewsletterListId: string | null;
  /**
   * Optional Ghost newsletter slug when list ID is not used.
   */
  ghostNewsletterSlug: string | null;
  /**
   * Optional custom newsletter label shown in participant-facing UIs.
   */
  ghostNewsletterLabel: string | null;
  /**
   * Whether Ghost double opt-in should be used for this organization newsletter.
   */
  ghostNewsletterDoubleOptInEnabled: boolean;
  created_at: any;
  updated_at: any;
  /**
   * An array relationship
   */
  /**
   * Settings-admin-only columns; null unless the caller holds canManageSettings for this organization.
   */
  Settings: OrganizationList_Organization_Settings | null;
  Users: OrganizationList_Organization_Users[];
}

export interface OrganizationList_Organization_aggregate_aggregate {
  __typename: "Organization_aggregate_fields";
  count: number;
}

export interface OrganizationList_Organization_aggregate {
  __typename: "Organization_aggregate";
  aggregate: OrganizationList_Organization_aggregate_aggregate | null;
}

export interface OrganizationList_OrganizationType {
  __typename: "OrganizationType";
  value: string;
}

export interface OrganizationList {
  /**
   * fetch data from the table: "Organization"
   */
  Organization: OrganizationList_Organization[];
  /**
   * fetch aggregated fields from the table: "Organization"
   */
  Organization_aggregate: OrganizationList_Organization_aggregate;
  /**
   * fetch data from the table: "OrganizationType"
   */
  OrganizationType: OrganizationList_OrganizationType[];
}

export interface OrganizationListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: Organization_bool_exp | null;
  order_by?: Organization_order_by[] | null;
}
