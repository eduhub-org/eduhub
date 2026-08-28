/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GuestDataRetentionMonths
// ====================================================

export interface GuestDataRetentionMonths_AppSettings {
  __typename: "AppSettings";
  /**
   * Months after an event ends before a guest registrant's personal data is anonymized automatically by the anonymize_guest_data cron job.
   */
  guestDataRetentionMonths: number;
}

export interface GuestDataRetentionMonths {
  /**
   * fetch data from the table: "AppSettings"
   */
  AppSettings: GuestDataRetentionMonths_AppSettings[];
}
