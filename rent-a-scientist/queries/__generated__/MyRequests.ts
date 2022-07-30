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
  /**
   * An object relationship
   */
  School: MyRequests_SchoolClassRequest_SchoolClass_School;
}

export interface MyRequests_SchoolClassRequest {
  __typename: "SchoolClassRequest";
  id: number;
  offerId: number;
  possibleDays: any;
  assigned_day: number | null;
  commentTime: string | null;
  commentGeneral: string | null;
  /**
   * An object relationship
   */
  SchoolClass: MyRequests_SchoolClassRequest_SchoolClass;
}

export interface MyRequests {
  /**
   * fetch data from the table: "SchoolClassRequest"
   */
  SchoolClassRequest: MyRequests_SchoolClassRequest[];
}
