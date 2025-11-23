/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseFundingOrganizationsByOrganizationId
// ====================================================

export interface CourseFundingOrganizationsByOrganizationId_CourseFundingOrganization_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface CourseFundingOrganizationsByOrganizationId_CourseFundingOrganization {
  __typename: "CourseFundingOrganization";
  id: number;
  organizationId: number;
  courseId: number;
  /**
   * An object relationship
   */
  Course: CourseFundingOrganizationsByOrganizationId_CourseFundingOrganization_Course;
}

export interface CourseFundingOrganizationsByOrganizationId {
  /**
   * fetch data from the table: "CourseFundingOrganization"
   */
  CourseFundingOrganization: CourseFundingOrganizationsByOrganizationId_CourseFundingOrganization[];
}

export interface CourseFundingOrganizationsByOrganizationIdVariables {
  organizationIds: number[];
}
