/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobPostingType_enum, JobOccupation_enum, JobRegion_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: HomeJobTilesAll
// ====================================================

export interface HomeJobTilesAll_JobPosting_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  /**
   * Path to the organization logo image file
   */
  logo: string | null;
}

export interface HomeJobTilesAll_JobPosting {
  __typename: "JobPosting";
  id: number;
  title: string;
  type: JobPostingType_enum;
  occupation: JobOccupation_enum;
  location: string | null;
  region: JobRegion_enum | null;
  featured: boolean;
  publishedAt: any | null;
  /**
   * An object relationship
   */
  Organization: HomeJobTilesAll_JobPosting_Organization;
}

export interface HomeJobTilesAll {
  /**
   * fetch data from the table: "JobPosting"
   */
  JobPosting: HomeJobTilesAll_JobPosting[];
}

export interface HomeJobTilesAllVariables {
  limit?: number | null;
  offset?: number | null;
}
