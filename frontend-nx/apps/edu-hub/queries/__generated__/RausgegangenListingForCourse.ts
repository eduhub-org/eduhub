/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RausgegangenEventCategory_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: RausgegangenListingForCourse
// ====================================================

export interface RausgegangenListingForCourse_Course_by_pk_Program_Organization_Features {
  __typename: "OrganizationFeature";
  id: number;
}

export interface RausgegangenListingForCourse_Course_by_pk_Program_Organization {
  __typename: "Organization";
  id: number;
  /**
   * An array relationship
   */
  Features: RausgegangenListingForCourse_Course_by_pk_Program_Organization_Features[];
}

export interface RausgegangenListingForCourse_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  type: string;
  /**
   * An object relationship
   */
  Organization: RausgegangenListingForCourse_Course_by_pk_Program_Organization;
}

export interface RausgegangenListingForCourse_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * An object relationship
   */
  Program: RausgegangenListingForCourse_Course_by_pk_Program;
}

export interface RausgegangenListingForCourse_RausgegangenListing {
  __typename: "RausgegangenListing";
  id: number;
  courseId: number;
  enabled: boolean;
  category: RausgegangenEventCategory_enum;
  tags: any;
  /**
   * Whether the last sync sent the event as published (false in test mode and outside production)
   */
  published: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncedAt: any | null;
  previewUrl: string | null;
  publicUrl: string | null;
}

export interface RausgegangenListingForCourse_RausgegangenEventCategory {
  __typename: "RausgegangenEventCategory";
  value: string;
}

export interface RausgegangenListingForCourse {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: RausgegangenListingForCourse_Course_by_pk | null;
  /**
   * fetch data from the table: "RausgegangenListing"
   */
  RausgegangenListing: RausgegangenListingForCourse_RausgegangenListing[];
  /**
   * fetch data from the table: "RausgegangenEventCategory"
   */
  RausgegangenEventCategory: RausgegangenListingForCourse_RausgegangenEventCategory[];
}

export interface RausgegangenListingForCourseVariables {
  courseId: number;
}
