/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseInput, AddonMappingInput, SelectedAddonInput } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CreateStripeCheckout
// ====================================================

export interface CreateStripeCheckout_createStripeCheckout {
  __typename: "CreateStripeCheckoutResult";
  success: boolean;
  checkoutUrl: string | null;
  sessionId: string | null;
  error: string | null;
  messageKey: string | null;
}

export interface CreateStripeCheckout {
  /**
   * Creates a Stripe Checkout Session for course enrollment with add-ons
   */
  createStripeCheckout: CreateStripeCheckout_createStripeCheckout;
}

export interface CreateStripeCheckoutVariables {
  courseId: number;
  enrollmentId: number;
  formbricksResponseId?: string | null;
  userEmail?: string | null;
  course?: CourseInput | null;
  addonMappings?: AddonMappingInput[] | null;
  selectedAddons?: SelectedAddonInput[] | null;
}
