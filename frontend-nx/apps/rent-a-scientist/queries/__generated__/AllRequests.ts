/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllRequests
// ====================================================

export interface AllRequests_SchoolClassRequest_SchoolClass_School {
  __typename: "School";
  dstnr: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  district: string;
}

export interface AllRequests_SchoolClassRequest_SchoolClass_Teacher_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
}

export interface AllRequests_SchoolClassRequest_SchoolClass_Teacher {
  __typename: "Teacher";
  id: number;
  /**
   * An object relationship
   */
  User: AllRequests_SchoolClassRequest_SchoolClass_Teacher_User;
}

export interface AllRequests_SchoolClassRequest_SchoolClass {
  __typename: "SchoolClass";
  id: number;
  name: string;
  studensCount: number;
  contact: string | null;
  grade: number;
  /**
   * An object relationship
   */
  School: AllRequests_SchoolClassRequest_SchoolClass_School;
  /**
   * An object relationship
   */
  Teacher: AllRequests_SchoolClassRequest_SchoolClass_Teacher;
}

export interface AllRequests_SchoolClassRequest_ScientistOffer_Program {
  __typename: "Program";
  id: number;
}

export interface AllRequests_SchoolClassRequest_ScientistOffer {
  __typename: "ScientistOffer";
  id: number;
  title: string;
  description: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  possibleDays: any;
  maxDeployments: number;
  /**
   * An object relationship
   */
  Program: AllRequests_SchoolClassRequest_ScientistOffer_Program;
}

export interface AllRequests_SchoolClassRequest {
  __typename: "SchoolClassRequest";
  id: number;
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
  SchoolClass: AllRequests_SchoolClassRequest_SchoolClass;
  /**
   * An object relationship
   */
  ScientistOffer: AllRequests_SchoolClassRequest_ScientistOffer;
}

export interface AllRequests {
  /**
   * fetch data from the table: "SchoolClassRequest"
   */
  SchoolClassRequest: AllRequests_SchoolClassRequest[];
}
