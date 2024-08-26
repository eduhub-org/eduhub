/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteUser
// ====================================================

export interface DeleteUser_anonymizeUser_steps {
  __typename: "AnonymizationSteps";
  keycloak_deletion: boolean;
  user_data_anonymization: boolean;
  motivation_letter_anonymization: boolean;
  profile_picture_removal: boolean;
  certificate_anonymization: boolean;
}

export interface DeleteUser_anonymizeUser {
  __typename: "AnonymizeUserResult";
  anonymizedUserId: string | null;
  messageKey: string | null;
  error: string | null;
  steps: DeleteUser_anonymizeUser_steps | null;
}

export interface DeleteUser {
  /**
   * Anonymizes a user's data in Hasura and Googl Cloud bucket and deletes it in Keycloak
   */
  anonymizeUser: DeleteUser_anonymizeUser | null;
}

export interface DeleteUserVariables {
  id: any;
}
