/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ScientistOfferById
// ====================================================

export interface ScientistOfferById_ScientistOffer_by_pk_RequestsCount_aggregate {
  __typename: "SchoolClassRequest_aggregate_fields";
  count: number;
}

export interface ScientistOfferById_ScientistOffer_by_pk_RequestsCount {
  __typename: "SchoolClassRequest_aggregate";
  aggregate: ScientistOfferById_ScientistOffer_by_pk_RequestsCount_aggregate | null;
}

export interface ScientistOfferById_ScientistOffer_by_pk_ScientistOfferRelations_Scientist {
  __typename: "Scientist";
  id: number;
  forename: string;
  surname: string;
  title: string;
  image: string | null;
}

export interface ScientistOfferById_ScientistOffer_by_pk_ScientistOfferRelations {
  __typename: "ScientistOfferRelation";
  /**
   * An object relationship
   */
  Scientist: ScientistOfferById_ScientistOffer_by_pk_ScientistOfferRelations_Scientist;
}

export interface ScientistOfferById_ScientistOffer_by_pk {
  __typename: "ScientistOffer";
  /**
   * An aggregate relationship
   */
  RequestsCount: ScientistOfferById_ScientistOffer_by_pk_RequestsCount;
  id: number;
  format: string;
  minimumGrade: number;
  maximumGrade: number;
  possibleDays: any;
  timeWindow: any;
  maxDeployments: number;
  possibleLocations: any;
  equipmentRequired: string;
  roomRequirements: string;
  title: string;
  description: string;
  duration: string;
  extraComment: string;
  subjectComment: string;
  programId: number;
  classPreparation: string;
  institutionName: string;
  institutionLogo: string;
  categories: any;
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
  researchSubject: string | null;
  /**
   * An array relationship
   */
  ScientistOfferRelations: ScientistOfferById_ScientistOffer_by_pk_ScientistOfferRelations[];
}

export interface ScientistOfferById {
  /**
   * fetch data from the table: "ScientistOffer" using primary key columns
   */
  ScientistOffer_by_pk: ScientistOfferById_ScientistOffer_by_pk | null;
}

export interface ScientistOfferByIdVariables {
  id: number;
}
