import { gql } from '@apollo/client';

export const INSTRUCTOR_INSERT_PROJECT = gql`
  mutation InstructorInsertProject(
    $title: String!
    $type: String
    $proposedByUserId: uuid!
    $courseId: Int!
  ) {
    insert_Project_one(
      object: {
        title: $title
        type: $type
        proposedByUserId: $proposedByUserId
        status: PROPOSED
        acceptingParticipants: true
        ProjectCourses: { data: { courseId: $courseId } }
      }
    ) {
      id
    }
  }
`;

export const UPDATE_PROJECT_CONFIRM_TEAM = gql`
  mutation UpdateProjectConfirmTeam(
    $itemId: Int!
    $type: String!
    $documentationTemplateId: Int!
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: {
        type: $type
        documentationTemplateId: $documentationTemplateId
        status: ONGOING
      }
    ) {
      id
      status
      type
      documentationTemplateId
    }
  }
`;

export const UPDATE_PROJECT_APPROVE = gql`
  mutation UpdateProjectApprove(
    $itemId: Int!
    $score: numeric
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: COMPLETED, rating: PASSED, score: $score }
    ) {
      id
      status
      rating
      score
    }
  }
`;

export const UPDATE_PROJECT_SEND_BACK = gql`
  mutation UpdateProjectSendBack($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: ONGOING, submittedAt: null }
    ) {
      id
      status
      submittedAt
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

export const UPDATE_PROJECT_PUBLISH = gql`
  mutation UpdateProjectPublish($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: PUBLISHED }
    ) {
      id
      status
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
