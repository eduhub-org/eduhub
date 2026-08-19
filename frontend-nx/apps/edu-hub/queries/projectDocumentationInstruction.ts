import { gql } from '@apollo/client';

/** Instructions without a stored PDF are drafts and must not appear in pickers or the admin table. */
export const PROJECT_DOCUMENTATION_INSTRUCTION_HAS_PDF_WHERE = {
  url: { _is_null: false, _neq: '' },
} as const;

// Paginated variant used by the app-settings admin grid; ProjectDocumentation-
// Instructions (without filter args) above is kept for the non-paginated
// instructor / project dialogs.
export const PROJECT_DOCUMENTATION_INSTRUCTIONS_TABLE = gql`
  query ProjectDocumentationInstructionsTable(
    $limit: Int = 20
    $offset: Int = 0
    $filter: ProjectDocumentationInstruction_bool_exp = {}
    $order_by: [ProjectDocumentationInstruction_order_by!] = [
      { projectTypeValue: asc }
      { isDefault: desc }
      { title: asc }
    ]
  ) {
    ProjectDocumentationInstruction(
      limit: $limit
      offset: $offset
      order_by: $order_by
      where: $filter
    ) {
      id
      title
      url
      projectTypeValue
      isDefault
      updated_at
      Projects_aggregate {
        aggregate {
          count
        }
      }
    }
    ProjectDocumentationInstruction_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

export const INSERT_PROJECT_DOCUMENTATION_INSTRUCTION = gql`
  mutation InsertProjectDocumentationInstruction(
    $title: String!
    $projectTypeValue: String!
  ) {
    insert_ProjectDocumentationInstruction_one(
      object: {
        title: $title
        projectTypeValue: $projectTypeValue
      }
    ) {
      id
      title
      projectTypeValue
      isDefault
    }
  }
`;

export const UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_PROJECT_TYPE = gql`
  mutation UpdateProjectDocumentationInstructionProjectType($itemId: Int!, $value: String!) {
    update_ProjectDocumentationInstruction_by_pk(
      pk_columns: { id: $itemId }
      _set: { projectTypeValue: $value }
    ) {
      id
      projectTypeValue
    }
  }
`;

export const DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_ACTION = gql`
  mutation DeleteProjectDocumentationInstructionAction($instructionId: Int!) {
    deleteProjectDocumentationInstruction(instructionId: $instructionId) {
      success
      messageKey
      error
      reassignedProjectCount
    }
  }
`;

export const UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_TITLE = gql`
  mutation UpdateProjectDocumentationInstructionTitle($itemId: Int!, $text: String!) {
    update_ProjectDocumentationInstruction_by_pk(
      pk_columns: { id: $itemId }
      _set: { title: $text }
    ) {
      id
      title
    }
  }
`;

// FileUpload spreads the action's filePath as `url` into submitMutation's
// variables, so the mutation must declare `url` (not `text`) to consume it.
export const UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION_URL = gql`
  mutation UpdateProjectDocumentationInstructionUrl($itemId: Int!, $url: String) {
    update_ProjectDocumentationInstruction_by_pk(
      pk_columns: { id: $itemId }
      _set: { url: $url }
    ) {
      id
      url
    }
  }
`;

export const DELETE_PROJECT_DOCUMENTATION_INSTRUCTION = gql`
  mutation DeleteProjectDocumentationInstruction($id: Int!) {
    delete_ProjectDocumentationInstruction_by_pk(id: $id) {
      id
    }
  }
`;

export const SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT = gql`
  mutation SetProjectDocumentationInstructionDefault($instructionId: Int!) {
    setProjectDocumentationInstructionDefault(instructionId: $instructionId) {
      success
      messageKey
      error
      projectTypeValue
    }
  }
`;

export const SAVE_PROJECT_DOCUMENTATION_INSTRUCTION = gql`
  mutation SaveProjectDocumentationInstruction(
    $base64File: String!
    $fileName: String!
    $projectDocumentationInstructionId: Int!
  ) {
    saveProjectDocumentationInstruction(
      base64file: $base64File
      filename: $fileName
      projectDocumentationInstructionId: $projectDocumentationInstructionId
    ) {
      success
      messageKey
      error
      filePath
      accessUrl
    }
  }
`;

/**
 * The instructions the caller may manage themselves.
 *
 * The caller passes the whole bool_exp (project type plus
 * `createdByUserId: {_eq: <me>}`); Hasura ANDs its own select filter on top, so a
 * client-side filter can never widen visibility. Unlike
 * PROJECT_DOCUMENTATION_INSTRUCTIONS this does NOT filter on `url`: a draft left
 * behind by a failed upload has to stay visible here so its owner can retry or
 * delete it.
 */
export const MY_PROJECT_DOCUMENTATION_INSTRUCTIONS = gql`
  query MyProjectDocumentationInstructions(
    $filter: ProjectDocumentationInstruction_bool_exp!
  ) {
    ProjectDocumentationInstruction(where: $filter, order_by: [{ title: asc }]) {
      id
      title
      url
      projectTypeValue
      isDefault
      updated_at
    }
  }
`;
