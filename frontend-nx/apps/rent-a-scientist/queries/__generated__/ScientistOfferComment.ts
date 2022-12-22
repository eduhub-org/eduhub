/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ScientistOfferComment
// ====================================================

export interface ScientistOfferComment_RequestsCount_aggregate {
  __typename: "SchoolClassRequest_aggregate_fields";
  count: number;
}

export interface ScientistOfferComment_RequestsCount {
  __typename: "SchoolClassRequest_aggregate";
  aggregate: ScientistOfferComment_RequestsCount_aggregate | null;
}

export interface ScientistOfferComment_ScientistOfferRelations_Scientist {
  __typename: "Scientist";
  id: number;
  forename: string;
  surname: string;
  title: string;
  image: string | null;
}

export interface ScientistOfferComment_ScientistOfferRelations {
  __typename: "ScientistOfferRelation";
  /**
   * An object relationship
   */
  Scientist: ScientistOfferComment_ScientistOfferRelations_Scientist;
}

export interface ScientistOfferComment {
  __typename: "ScientistOffer";
  /**
   * An aggregate relationship
   */
  RequestsCount: ScientistOfferComment_RequestsCount;
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
  ScientistOfferRelations: ScientistOfferComment_ScientistOfferRelations[];
}
