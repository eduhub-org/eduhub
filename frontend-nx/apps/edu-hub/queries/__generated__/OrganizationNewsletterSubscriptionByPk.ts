/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: OrganizationNewsletterSubscriptionByPk
// ====================================================

export interface OrganizationNewsletterSubscriptionByPk_OrganizationNewsletterSubscription_by_pk {
  __typename: "OrganizationNewsletterSubscription";
  userId: any;
  organizationId: number;
  /**
   * Current subscription state in local database and synchronization pipeline.
   */
  status: string;
  /**
   * Origin of the latest subscription state change.
   */
  source: string;
  /**
   * Last synchronization error message.
   */
  errorMessage: string | null;
  lastSyncedAt: any | null;
}

export interface OrganizationNewsletterSubscriptionByPk {
  /**
   * fetch data from the table: "OrganizationNewsletterSubscription" using primary key columns
   */
  OrganizationNewsletterSubscription_by_pk: OrganizationNewsletterSubscriptionByPk_OrganizationNewsletterSubscription_by_pk | null;
}

export interface OrganizationNewsletterSubscriptionByPkVariables {
  userId: any;
  organizationId: number;
}
