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

export const UPDATE_PROJECT_REVIEW_VERDICT = gql`
  # The whole verdict in one statement: status, rating, comment and the
  # (possibly extended) submission deadline are written together, so a failure
  # can never leave a project half-reviewed — sent back for revision but with a
  # deadline the team can no longer meet, or rated without the status to match.
  #
  # submissionDeadline is always part of the _set: for "keep the deadline" the
  # caller passes the project's own current value straight back, which is a
  # no-op write. Resolving the course/program default here instead would
  # silently pin an inherited deadline onto the project row.
  #
  # The set_project_submitted_metadata trigger clears submittedAt/submittedBy
  # when status leaves SUBMITTED, so those need no explicit value. The status
  # change is what fires the notification mail, and because it lands in the same
  # statement as the deadline, the mail always reads the current deadline back.
  mutation UpdateProjectReviewVerdict(
    $itemId: Int!
    $status: ProjectStatus_enum!
    $rating: ProjectRating_enum!
    $ratingComment: String
    $submissionDeadline: timestamptz
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: {
        status: $status
        rating: $rating
        ratingComment: $ratingComment
        submissionDeadline: $submissionDeadline
      }
    ) {
      id
      status
      rating
      ratingComment
      submissionDeadline
      submittedAt
      submittedBy
    }
  }
`;
