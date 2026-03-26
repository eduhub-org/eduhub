/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpsertOrganizationNewsletterSubscription
// ====================================================

export interface UpsertOrganizationNewsletterSubscription_insert_OrganizationNewsletterSubscription_one {
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

export interface UpsertOrganizationNewsletterSubscription {
  /**
   * insert a single row into the table: "OrganizationNewsletterSubscription"
   */
  insert_OrganizationNewsletterSubscription_one: UpsertOrganizationNewsletterSubscription_insert_OrganizationNewsletterSubscription_one | null;
}

export interface UpsertOrganizationNewsletterSubscriptionVariables {
  userId: any;
  organizationId: number;
  status: string;
  source: string;
}
