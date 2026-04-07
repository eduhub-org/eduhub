/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum, InvoiceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: EnrollmentFragment
// ====================================================

export interface EnrollmentFragment_Invoices {
  __typename: "Invoice";
  id: number;
  /**
   * Invoice lifecycle status. Synced from Stripe webhooks
   */
  status: InvoiceStatus_enum;
  /**
   * Stripe-hosted invoice page URL
   */
  stripeHostedInvoiceUrl: string | null;
  /**
   * Stripe-hosted PDF download URL
   */
  stripeInvoicePdfUrl: string | null;
}

export interface EnrollmentFragment {
  __typename: "CourseEnrollment";
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  /**
   * The last day a user can confirm his/her invitation to the given course
   */
  invitationExpirationDate: any | null;
  id: number;
  created_at: any | null;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * Organization paying for this enrollment (B2B). NULL means the enrolling user pays personally (B2C)
   */
  billingOrganizationId: number | null;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
  /**
   * An array relationship
   */
  Invoices: EnrollmentFragment_Invoices[];
}
