/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseParticipants
// ====================================================

export interface CourseParticipants_CourseParticipant_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * Immutable Matrix user handle, set once from Keycloak. Format: firstname.lastname.uuid6
   */
  matrixUserHandle: string | null;
}

export interface CourseParticipants_CourseParticipant {
  __typename: "CourseParticipant";
  userId: any | null;
  /**
   * An object relationship
   */
  User: CourseParticipants_CourseParticipant_User | null;
}

export interface CourseParticipants_CourseParticipant_aggregate_aggregate {
  __typename: "CourseParticipant_aggregate_fields";
  count: number;
}

export interface CourseParticipants_CourseParticipant_aggregate {
  __typename: "CourseParticipant_aggregate";
  aggregate: CourseParticipants_CourseParticipant_aggregate_aggregate | null;
}

export interface CourseParticipants {
  /**
   * fetch data from the table: "CourseParticipant"
   */
  CourseParticipant: CourseParticipants_CourseParticipant[];
  /**
   * fetch aggregated fields from the table: "CourseParticipant"
   */
  CourseParticipant_aggregate: CourseParticipants_CourseParticipant_aggregate;
}

export interface CourseParticipantsVariables {
  courseId: number;
  limit?: number | null;
}
