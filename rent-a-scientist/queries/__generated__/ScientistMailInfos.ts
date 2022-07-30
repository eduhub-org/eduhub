/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ScientistMailInfos
// ====================================================

export interface ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_School {
  __typename: "School";
  dstnr: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_Teacher_User {
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

export interface ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_Teacher {
  __typename: "Teacher";
  id: number;
  /**
   * An object relationship
   */
  User: ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_Teacher_User;
}

export interface ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass {
  __typename: "SchoolClass";
  id: number;
  grade: number;
  studensCount: number;
  /**
   * An object relationship
   */
  School: ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_School;
  /**
   * An object relationship
   */
  Teacher: ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass_Teacher;
}

export interface ScientistMailInfos_ScientistOffer_SchoolClassRequests {
  __typename: "SchoolClassRequest";
  id: number;
  /**
   * Needs to be one of the possibleDays values to be valid. -1 is used as value to indicate rejection.
   */
  assigned_day: number | null;
  commentTime: string | null;
  commentGeneral: string | null;
  /**
   * An object relationship
   */
  SchoolClass: ScientistMailInfos_ScientistOffer_SchoolClassRequests_SchoolClass;
}

export interface ScientistMailInfos_ScientistOffer {
  __typename: "ScientistOffer";
  id: number;
  contactName: string | null;
  contactEmail: string | null;
  /**
   * An array relationship
   */
  SchoolClassRequests: ScientistMailInfos_ScientistOffer_SchoolClassRequests[];
}

export interface ScientistMailInfos {
  /**
   * fetch data from the table: "ScientistOffer"
   */
  ScientistOffer: ScientistMailInfos_ScientistOffer[];
}

export interface ScientistMailInfosVariables {
  pid: number;
}
