import { gql } from '@apollo/client';

export const INSTRUCTOR_INSERT_PROJECT = gql`
  # Atomic create-project flow for instructors. Passing an empty $authors array yields a
  # template-style project (PROPOSED status with no ACCEPTED authors) that course participants
  # can claim via copyProjectFromTemplate; passing one or more authors creates a regular team
  # project owned by those users.
  mutation InstructorInsertProject(
    $title: String!
    $type: String
    $documentationInstructionId: Int
    $proposedByUserId: uuid!
    $courseId: Int!
    $authors: [ProjectAuthor_insert_input!]!
  ) {
    insert_Project_one(
      object: {
        title: $title
        type: $type
        documentationInstructionId: $documentationInstructionId
        proposedByUserId: $proposedByUserId
        status: PROPOSED
        acceptingParticipants: true
        ProjectCourses: { data: { courseId: $courseId } }
        ProjectAuthors: { data: $authors }
      }
    ) {
      id
    }
  }
`;

// Sets type and documentationInstructionId together so the
// Project_instruction_matches_type trigger never sees a transient mismatch
// (it fires BEFORE UPDATE OF either column).
export const UPDATE_PROJECT_TYPE = gql`
  mutation UpdateProjectType(
    $itemId: Int!
    $value: String
    $documentationInstructionId: Int
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { type: $value, documentationInstructionId: $documentationInstructionId }
    ) {
      id
      type
      documentationInstructionId
    }
  }
`;

export const UPDATE_PROJECT_CONFIRM_TEAM = gql`
  mutation UpdateProjectConfirmTeam(
    $itemId: Int!
    $type: String!
    $documentationInstructionId: Int!
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: {
        type: $type
        documentationInstructionId: $documentationInstructionId
        status: ONGOING
        acceptingParticipants: false
      }
    ) {
      id
      status
      type
      documentationInstructionId
    }
  }
`;

export const UPDATE_PROJECT_RATING_AND_COMMENT = gql`
  mutation UpdateProjectRatingAndComment(
    $itemId: Int!
    $rating: ProjectRating_enum!
    $ratingComment: String
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { rating: $rating, ratingComment: $ratingComment }
    ) {
      id
      rating
      ratingComment
    }
  }
`;

export const UPDATE_PROJECT_APPROVE = gql`
  mutation UpdateProjectApprove($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: COMPLETED, rating: PASSED }
    ) {
      id
      status
      rating
    }
  }
`;

export const UPDATE_PROJECT_SEND_BACK = gql`
  # The set_project_submitted_metadata trigger nulls both submittedAt and
  # submittedBy when status transitions out of SUBMITTED, so this mutation only
  # needs to flip status.
  mutation UpdateProjectSendBack($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: ONGOING }
    ) {
      id
      status
      submittedAt
      submittedBy
    }
  }
`;

export const UPDATE_PROJECT_REJECT = gql`
  mutation UpdateProjectReject($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: INCOMPLETE, rating: FAILED }
    ) {
      id
      status
      rating
    }
  }
`;

export const UPDATE_PROJECT_SUGGESTED_FOR_PUBLICATION = gql`
  mutation UpdateProjectSuggestedForPublication(
    $itemId: Int!
    $suggested: Boolean!
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { suggestedForPublication: $suggested }
    ) {
      id
      suggestedForPublication
    }
  }
`;

export const INSTRUCTOR_INSERT_PROJECT_AUTHOR = gql`
  mutation InstructorInsertProjectAuthor(
    $projectId: Int!
    $userId: uuid!
    $participationStatus: ProjectParticipationStatus_enum!
  ) {
    insert_ProjectAuthor_one(
      object: {
        projectId: $projectId
        userId: $userId
        participationStatus: $participationStatus
      }
    ) {
      id
    }
  }
`;

export const INSERT_PROJECT_MENTOR = gql`
  mutation InsertProjectMentor($projectId: Int!, $userId: uuid!) {
    insert_ProjectMentor_one(
      object: { projectId: $projectId, userId: $userId }
    ) {
      id
    }
  }
`;

export const DELETE_PROJECT_MENTOR = gql`
  mutation DeleteProjectMentor($id: Int!) {
    delete_ProjectMentor_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: Int!) {
    delete_Project_by_pk(id: $id) {
      id
    }
  }
`;
