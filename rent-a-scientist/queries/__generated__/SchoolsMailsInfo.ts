/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SchoolsMailsInfo
// ====================================================

export interface SchoolsMailsInfo_SchoolClassRequest_SchoolClass_Teacher_User {
  __typename: "User";
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

export interface SchoolsMailsInfo_SchoolClassRequest_SchoolClass_Teacher {
  __typename: "Teacher";
  id: number;
  /**
   * An object relationship
   */
  User: SchoolsMailsInfo_SchoolClassRequest_SchoolClass_Teacher_User;
}

export interface SchoolsMailsInfo_SchoolClassRequest_SchoolClass {
  __typename: "SchoolClass";
  id: number;
  name: string;
  grade: number;
  /**
   * An object relationship
   */
  Teacher: SchoolsMailsInfo_SchoolClassRequest_SchoolClass_Teacher;
}

export interface SchoolsMailsInfo_SchoolClassRequest_ScientistOffer {
  __typename: "ScientistOffer";
  id: number;
  title: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactName: string | null;
  timeWindow: any;
}

export interface SchoolsMailsInfo_SchoolClassRequest {
  __typename: "SchoolClassRequest";
  id: number;
  /**
   * An object relationship
   */
  SchoolClass: SchoolsMailsInfo_SchoolClassRequest_SchoolClass;
  /**
   * Needs to be one of the possibleDays values to be valid. -1 is used as value to indicate rejection.
   */
  assigned_day: number | null;
  /**
   * An object relationship
   */
  ScientistOffer: SchoolsMailsInfo_SchoolClassRequest_ScientistOffer;
}

export interface SchoolsMailsInfo {
  /**
   * fetch data from the table: "SchoolClassRequest"
   */
  SchoolClassRequest: SchoolsMailsInfo_SchoolClassRequest[];
}

export interface SchoolsMailsInfoVariables {
  pid: number;
}
