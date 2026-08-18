import { gql } from '@apollo/client';

export const PROJECT_TYPES = gql`
  query ProjectTypes {
    ProjectType(order_by: { value: asc }) {
      value
      comment
      requiresDocumentation
      requiresPresentation
      requiresExternalUrl
      requiresCoverImage
      certificateTemplateId
      CertificateTemplate {
        id
        name
      }
    }
  }
`;

export const UPDATE_PROJECT_TYPE_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateProjectTypeCertificateTemplate($value: String!, $templateId: Int) {
    update_ProjectType_by_pk(
      pk_columns: { value: $value }
      _set: { certificateTemplateId: $templateId }
    ) {
      value
      certificateTemplateId
      CertificateTemplate {
        id
        name
      }
    }
  }
`;

export const PROJECT_DOCUMENTATION_INSTRUCTIONS = gql`
  query ProjectDocumentationInstructions {
    ProjectDocumentationInstruction(
      where: { url: { _is_null: false, _neq: "" } }
      order_by: [{ projectTypeValue: asc }, { isDefault: desc }, { title: asc }]
    ) {
      id
      title
      url
      projectTypeValue
      isDefault
    }
  }
`;

export const PROJECT_FRAGMENT_DETAILED = gql`
  fragment ProjectFragmentDetailed on Project {
    id
    title
    tagline
    description
    coverImageUrl
    documentationUrl
    presentationUrl
    externalUrl
    documentationInstructionId
    status
    published
    type
    rating
    ratingComment
    suggestedForPublication
    acceptingParticipants
    organizationId
    proposedByUserId
    parentProjectId
    submittedAt
    submittedBy
    sentBackAt
    projectReviewRequestedAt
    submissionDeadline
    created_at
    updated_at
    Organization {
      id
      name
    }
    ProjectType {
      value
      requiresDocumentation
      requiresPresentation
      requiresExternalUrl
      requiresCoverImage
    }
    ProjectDocumentationInstruction {
      id
      title
      url
    }
    SubmittedByUser {
      id
      firstName
      lastName
    }
    ProjectAuthors {
      id
      userId
      participationStatus
      User {
        id
        firstName
        lastName
        picture
        externalProfile
        Organization {
          id
          name
        }
      }
    }
    ProjectMentors {
      id
      userId
      User {
        id
        firstName
        lastName
      }
    }
    ProjectConsentEvents(order_by: [{ created_at: desc }, { id: desc }], limit: 1) {
      id
      eventType
      actorUserId
      created_at
      termsVersion
      ActorUser {
        id
        firstName
        lastName
      }
    }
  }
`;

export const PROJECTS_BY_COURSE = gql`
  ${PROJECT_FRAGMENT_DETAILED}
  query ProjectsByCourse($courseId: Int!) {
    Project(
      where: { ProjectCourses: { courseId: { _eq: $courseId } } }
      order_by: { id: asc }
    ) {
      ...ProjectFragmentDetailed
    }
  }
`;

export const MY_PROJECT_BY_COURSE = gql`
  # Matches projects in the course where the user is a confirmed author (ACCEPTED)
  # or was marked EXCLUDED from the final submission. The caller prefers the
  # ACCEPTED project and otherwise shows the EXCLUDED one with a "you were
  # excluded" notice, so a few rows are fetched instead of limiting to one.
  ${PROJECT_FRAGMENT_DETAILED}
  query MyProjectByCourse($courseId: Int!, $userId: uuid!) {
    Project(
      where: {
        _and: [
          { ProjectCourses: { courseId: { _eq: $courseId } } }
          {
            ProjectAuthors: {
              _and: [
                { userId: { _eq: $userId } }
                { participationStatus: { _in: [ACCEPTED, EXCLUDED] } }
              ]
            }
          }
        ]
      }
      order_by: { created_at: desc }
      limit: 5
    ) {
      ...ProjectFragmentDetailed
    }
  }
`;

export const INSERT_SELF_PROPOSED_PROJECT = gql`
  # Course participants only (JWT role user → user_access). The nested ProjectAuthor row is
  # inserted with participationStatus: ACCEPTED; the ProjectAuthor insert_permission for user_access
  # gates this on Project.proposedByUserId = self AND Project.status = PROPOSED, and presets
  # userId to the session user.
  mutation InsertSelfProposedProject(
    $title: String!
    $tagline: String
    $description: String
    $organizationId: Int
    $type: String
    $acceptingParticipants: Boolean!
    $proposedByUserId: uuid!
    $courseId: Int!
  ) {
    insert_Project_one(
      object: {
        title: $title
        tagline: $tagline
        description: $description
        organizationId: $organizationId
        type: $type
        acceptingParticipants: $acceptingParticipants
        proposedByUserId: $proposedByUserId
        status: PROPOSED
        ProjectAuthors: { data: { participationStatus: ACCEPTED } }
        ProjectCourses: { data: { courseId: $courseId } }
      }
    ) {
      id
    }
  }
`;

export const MARK_PROJECT_REVIEW_REQUESTED = gql`
  mutation MarkProjectReviewRequested($itemId: Int!, $requestedAt: timestamptz!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { projectReviewRequestedAt: $requestedAt, acceptingParticipants: false }
    ) {
      id
      projectReviewRequestedAt
      acceptingParticipants
    }
  }
`;

export const UPDATE_PROJECT_TITLE = gql`
  mutation UpdateProjectTitle($itemId: Int!, $text: String!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { title: $text }
    ) {
      id
      title
    }
  }
`;

export const UPDATE_PROJECT_TAGLINE = gql`
  mutation UpdateProjectTagline($itemId: Int!, $text: String!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { tagline: $text }
    ) {
      id
      tagline
    }
  }
`;

export const UPDATE_PROJECT_DESCRIPTION = gql`
  mutation UpdateProjectDescription($itemId: Int!, $text: String!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { description: $text }
    ) {
      id
      description
    }
  }
`;

export const UPDATE_PROJECT_DOCUMENTATION_URL = gql`
  mutation UpdateProjectDocumentationUrl($itemId: Int!, $text: String) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { documentationUrl: $text }
    ) {
      id
      documentationUrl
    }
  }
`;

export const UPDATE_PROJECT_PRESENTATION_URL = gql`
  mutation UpdateProjectPresentationUrl($itemId: Int!, $text: String) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { presentationUrl: $text }
    ) {
      id
      presentationUrl
    }
  }
`;

export const UPDATE_PROJECT_EXTERNAL_URL = gql`
  mutation UpdateProjectExternalUrl($itemId: Int!, $text: String!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { externalUrl: $text }
    ) {
      id
      externalUrl
    }
  }
`;

export const UPDATE_PROJECT_COVER_IMAGE_URL = gql`
  mutation UpdateProjectCoverImageUrl($itemId: Int!, $text: String) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { coverImageUrl: $text }
    ) {
      id
      coverImageUrl
    }
  }
`;

export const UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION = gql`
  mutation UpdateProjectDocumentationInstruction($itemId: Int!, $value: Int) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { documentationInstructionId: $value }
    ) {
      id
      documentationInstructionId
    }
  }
`;

export const UPDATE_PROJECT_ACCEPTING_PARTICIPANTS = gql`
  mutation UpdateProjectAcceptingParticipants($itemId: Int!, $value: Boolean!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { acceptingParticipants: $value }
    ) {
      id
      acceptingParticipants
    }
  }
`;

export const UPDATE_PROJECT_SUBMISSION_DEADLINE = gql`
  mutation UpdateProjectSubmissionDeadline($itemId: Int!, $value: timestamptz) {
    update_Project_by_pk(pk_columns: { id: $itemId }, _set: { submissionDeadline: $value }) {
      id
      submissionDeadline
    }
  }
`;

export const SUBMIT_PROJECT = gql`
  # submittedBy is filled server-side by the user_access update permission preset.
  # submittedAt is stamped by the set_project_submitted_metadata trigger on the
  # PROPOSED/ONGOING → SUBMITTED transition.
  mutation SubmitProject($itemId: Int!) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { status: SUBMITTED }
    ) {
      id
      status
      submittedAt
      submittedBy
    }
  }
`;

export const INSERT_PROJECT_AUTHOR_REQUEST = gql`
  # Join request from a course participant on another user's project. The ProjectAuthor insert
  # permission for user_access gates this on Project.acceptingParticipants AND proposedByUserId ≠ self,
  # and presets userId to the session user. participationStatus must be passed explicitly.
  mutation InsertProjectAuthorRequest($projectId: Int!) {
    insert_ProjectAuthor_one(
      object: { projectId: $projectId, participationStatus: REQUESTED }
    ) {
      id
      participationStatus
      userId
    }
  }
`;

export const INSERT_PROJECT_AUTHOR_REQUEST_AS_ADMIN = gql`
  mutation InsertProjectAuthorRequestAsAdmin($projectId: Int!, $userId: uuid!) {
    insert_ProjectAuthor_one(
      object: {
        projectId: $projectId
        participationStatus: REQUESTED
        userId: $userId
      }
    ) {
      id
      participationStatus
      userId
    }
  }
`;

export const UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS = gql`
  mutation UpdateProjectAuthorParticipationStatus(
    $id: Int!
    $value: ProjectParticipationStatus_enum!
  ) {
    update_ProjectAuthor_by_pk(
      pk_columns: { id: $id }
      _set: { participationStatus: $value }
    ) {
      id
      participationStatus
    }
  }
`;

export const DELETE_PROJECT_AUTHOR = gql`
  mutation DeleteProjectAuthor($id: Int!) {
    delete_ProjectAuthor_by_pk(id: $id) {
      id
    }
  }
`;

export const COPY_PROJECT_FROM_TEMPLATE = gql`
  mutation CopyProjectFromTemplate($parentProjectId: Int!, $courseId: Int!) {
    copyProjectFromTemplate(
      parentProjectId: $parentProjectId
      courseId: $courseId
    ) {
      success
      messageKey
      error
      projectId
    }
  }
`;


export const INSERT_PROJECT_CONSENT_EVENT = gql`
  mutation InsertProjectConsentEvent(
    $projectId: Int!
    $eventType: String!
    $termsVersion: String!
  ) {
    insert_ProjectConsentEvent_one(
      object: {
        projectId: $projectId
        eventType: $eventType
        termsVersion: $termsVersion
      }
    ) {
      id
      eventType
      created_at
      termsVersion
    }
  }
`;
