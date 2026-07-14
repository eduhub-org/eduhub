/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobPostingType_enum, JobOccupation_enum, JobRegion_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: HomeJobTilesByOrganization
// ====================================================

export interface HomeJobTilesByOrganization_JobPosting_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  logo: string | null;
}

export interface HomeJobTilesByOrganization_JobPosting {
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
  Organization: HomeJobTilesByOrganization_JobPosting_Organization;
}

export interface HomeJobTilesByOrganization {
  /**
   * fetch data from the table: "JobPosting"
   */
  JobPosting: HomeJobTilesByOrganization_JobPosting[];
}

export interface HomeJobTilesByOrganizationVariables {
  organizationId: number;
  limit?: number | null;
  offset?: number | null;
}
