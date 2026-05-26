/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectParticipationStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertProjectAuthorRequestAsAdmin
// ====================================================

export interface InsertProjectAuthorRequestAsAdmin_insert_ProjectAuthor_one {
  __typename: "ProjectAuthor";
  id: number;
  participationStatus: ProjectParticipationStatus_enum;
  userId: any;
}

export interface InsertProjectAuthorRequestAsAdmin {
  /**
   * insert a single row into the table: "ProjectAuthor"
   */
  insert_ProjectAuthor_one: InsertProjectAuthorRequestAsAdmin_insert_ProjectAuthor_one | null;
}

export interface InsertProjectAuthorRequestAsAdminVariables {
  projectId: number;
  userId: any;
}
