/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyOrganizationNewsletterOptions
// ====================================================

export interface MyOrganizationNewsletterOptions_Program_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  /**
   * Short organization newsletter description shown to participants in onboarding and profile preferences.
   */
  newsletterDescription: string | null;
  /**
   * Newsletter provider for this organization. Currently only GHOST is supported.
   */
  newsletterProvider: string;
  /**
   * Optional custom newsletter label shown in participant-facing UIs.
   */
  ghostNewsletterLabel: string | null;
  /**
   * Whether Ghost double opt-in should be used for this organization newsletter.
   */
  ghostNewsletterDoubleOptInEnabled: boolean;
  /**
   * Optional Ghost newsletter list identifier.
   */
  ghostNewsletterListId: string | null;
  /**
   * Optional Ghost newsletter slug when list ID is not used.
   */
  ghostNewsletterSlug: string | null;
}

export interface MyOrganizationNewsletterOptions_Program {
  __typename: "Program";
  /**
   * Organization that owns the program. References Organization.id (0 = platform default)
   */
  organizationId: number;
  /**
   * An object relationship
   */
  Organization: MyOrganizationNewsletterOptions_Program_Organization;
}

export interface MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  /**
   * Short organization newsletter description shown to participants in onboarding and profile preferences.
   */
  newsletterDescription: string | null;
  /**
   * Newsletter provider for this organization. Currently only GHOST is supported.
   */
  newsletterProvider: string;
  /**
   * Optional custom newsletter label shown in participant-facing UIs.
   */
  ghostNewsletterLabel: string | null;
  /**
   * Whether Ghost double opt-in should be used for this organization newsletter.
   */
  ghostNewsletterDoubleOptInEnabled: boolean;
  /**
   * Optional Ghost newsletter list identifier.
   */
  ghostNewsletterListId: string | null;
  /**
   * Optional Ghost newsletter slug when list ID is not used.
   */
  ghostNewsletterSlug: string | null;
}

export interface MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription {
  __typename: "OrganizationNewsletterSubscription";
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
  /**
   * An object relationship
   */
  Organization: MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription_Organization;
}

export interface MyOrganizationNewsletterOptions {
  /**
   * fetch data from the table: "Program"
   */
  Program: MyOrganizationNewsletterOptions_Program[];
  /**
   * fetch data from the table: "OrganizationNewsletterSubscription"
   */
  OrganizationNewsletterSubscription: MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription[];
}

export interface MyOrganizationNewsletterOptionsVariables {
  userId: any;
}
