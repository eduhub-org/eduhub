/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllScientistOffers
// ====================================================

export interface AllScientistOffers_ScientistOffer_RequestsCount_aggregate {
  __typename: "SchoolClassRequest_aggregate_fields";
  count: number;
}

export interface AllScientistOffers_ScientistOffer_RequestsCount {
  __typename: "SchoolClassRequest_aggregate";
  aggregate: AllScientistOffers_ScientistOffer_RequestsCount_aggregate | null;
}

export interface AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist {
  __typename: "Scientist";
  id: number;
  forename: string;
  surname: string;
  title: string;
  image: string | null;
}

export interface AllScientistOffers_ScientistOffer_ScientistOfferRelations {
  __typename: "ScientistOfferRelation";
  /**
   * An object relationship
   */
  Scientist: AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist;
}

export interface AllScientistOffers_ScientistOffer {
  __typename: "ScientistOffer";
  /**
   * An aggregate relationship
   */
  RequestsCount: AllScientistOffers_ScientistOffer_RequestsCount;
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
  ScientistOfferRelations: AllScientistOffers_ScientistOffer_ScientistOfferRelations[];
}

export interface AllScientistOffers {
  /**
   * fetch data from the table: "ScientistOffer"
   */
  ScientistOffer: AllScientistOffers_ScientistOffer[];
}
