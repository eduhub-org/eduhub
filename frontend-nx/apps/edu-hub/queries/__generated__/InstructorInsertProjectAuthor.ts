/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectParticipationStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InstructorInsertProjectAuthor
// ====================================================

export interface InstructorInsertProjectAuthor_insert_ProjectAuthor_one {
  __typename: "ProjectAuthor";
  id: number;
}

export interface InstructorInsertProjectAuthor {
  /**
   * insert a single row into the table: "ProjectAuthor"
   */
  insert_ProjectAuthor_one: InstructorInsertProjectAuthor_insert_ProjectAuthor_one | null;
}

export interface InstructorInsertProjectAuthorVariables {
  projectId: number;
  userId: any;
  participationStatus: ProjectParticipationStatus_enum;
}
