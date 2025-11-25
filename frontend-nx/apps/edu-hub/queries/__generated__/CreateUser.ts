/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateUser
// ====================================================

export interface CreateUser_createUser {
  __typename: "CreateUserResult";
  success: boolean;
  userId: any | null;
  keycloakUserId: string | null;
  emailQueued: boolean | null;
  scheduledAt: string | null;
  error: string | null;
  messageKey: string;
}

export interface CreateUser {
  /**
   * Creates a new user in Keycloak and Hasura, schedules welcome email
   */
  createUser: CreateUser_createUser;
}

export interface CreateUserVariables {
  firstName: string;
  lastName: string;
  email: string;
}
