/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyRequests
// ====================================================

export interface MyRequests_SchoolClassRequest_SchoolClass_School {
  __typename: "School";
  dstnr: string;
  name: string;
}

export interface MyRequests_SchoolClassRequest_SchoolClass {
  __typename: "SchoolClass";
  id: number;
  name: string;
  studensCount: number;
  grade: number;
  contact: string | null;
  /**
   * An object relationship
   */
  School: MyRequests_SchoolClassRequest_SchoolClass_School;
}

export interface MyRequests_SchoolClassRequest_ScientistOffer {
  __typename: "ScientistOffer";
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
}

export interface MyRequests_SchoolClassRequest {
  __typename: "SchoolClassRequest";
  id: number;
  offerId: number;
  possibleDays: any;
  /**
   * Needs to be one of the possibleDays values to be valid. -1 is used as value to indicate rejection.
   */
  assigned_day: number | null;
  commentTime: string | null;
  commentGeneral: string | null;
  /**
   * An object relationship
   */
  SchoolClass: MyRequests_SchoolClassRequest_SchoolClass;
  /**
   * An object relationship
   */
  ScientistOffer: MyRequests_SchoolClassRequest_ScientistOffer;
}

export interface MyRequests {
  /**
   * fetch data from the table: "SchoolClassRequest"
   */
  SchoolClassRequest: MyRequests_SchoolClassRequest[];
}
