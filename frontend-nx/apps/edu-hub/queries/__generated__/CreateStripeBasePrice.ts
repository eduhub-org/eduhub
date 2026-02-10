/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateStripeBasePrice
// ====================================================

export interface CreateStripeBasePrice_createStripeBasePrice {
  __typename: "CreateStripeBasePriceResult";
  success: boolean;
  messageKey: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  productName: string | null;
  priceAmount: number | null;
  currency: string | null;
  error: string | null;
}

export interface CreateStripeBasePrice {
  /**
   * Creates or updates Stripe Product and Price for a course's base price
   */
  createStripeBasePrice: CreateStripeBasePrice_createStripeBasePrice;
}

export interface CreateStripeBasePriceVariables {
  courseId: number;
  basePrice: number;
  currency?: string | null;
  courseTitle?: string | null;
}
