/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertSelfProposedProject
// ====================================================

export interface InsertSelfProposedProject_insert_Project_one {
  __typename: "Project";
  id: number;
}

export interface InsertSelfProposedProject {
  /**
   * insert a single row into the table: "Project"
   */
  insert_Project_one: InsertSelfProposedProject_insert_Project_one | null;
}

export interface InsertSelfProposedProjectVariables {
  title: string;
  tagline?: string | null;
  description?: string | null;
  organizationId?: number | null;
  type?: string | null;
  acceptingParticipants: boolean;
  proposedByUserId: any;
  courseId: number;
}
