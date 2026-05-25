import { gql } from "@apollo/client";

export const INSERT_PROGRAM = gql`
  mutation InsertProgram($title: String!, $today: date!) {
    insert_Program(
      objects: {
        lectureStart: $today
        lectureEnd: $today
        applicationStart: $today
        defaultApplicationEnd: $today
        achievementRecordUploadDeadline: $today
        title: $title
        visibility: false
        defaultMaxMissedSessions: 2
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_PROGRAM = gql`
  mutation DeleteProgram($id: Int!) {
    delete_Program_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_VISIBILITY = gql`
  mutation UpdateProgramVisibility($programId: Int!, $visible: Boolean!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { visibility: $visible }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_PUBLISHED = gql`
  mutation UpdateProgramPublished($programId: Int!, $published: Boolean!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { published: $published }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_SHOW_EXTENDED_APPLICATION_PERIOD_BANNER = gql`
  mutation UpdateProgramShowExtendedApplicationPeriodBanner($programId: Int!, $value: Boolean!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { showExtendedApplicationPeriodBanner: $value }
    ) {
      id
      showExtendedApplicationPeriodBanner
    }
  }
`;


export const UPDATE_PROGRAM_TITLE = gql`
  mutation UpdateProgramTitle($itemId: Int!, $text: String!) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { title: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_SHORT_TITLE = gql`
  mutation UpdateProgramShortTitle($itemId: Int!, $text: String!) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { shortTitle: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_MATRIX_INSTRUCTOR_ROOM = gql`
  mutation UpdateProgramMatrixInstructorRoom($itemId: Int!, $text: String) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { matrixInstructorRoomId: $text }
    ) {
      id
      matrixInstructorRoomId
    }
  }
`;

export const UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateProgramParticipationTemplate(
    $programId: Int!
    $templatePath: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { attendanceCertificateTemplateURL: $templatePath }
    ) {
      id
    }
  }
`;

export const UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateProgramAchievementTemplate(
    $programId: Int!
    $templatePath: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { achievementCertificateTemplateURL: $templatePath }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_APPLICATION_START = gql`
  mutation UpdateProgramApplicationStart(
    $programId: Int!
    $applicationStart: date!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { applicationStart: $applicationStart }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_APPLICATION_END = gql`
  mutation UpdateProgramApplicationEnd(
    $programId: Int!
    $applicationEnd: date!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { defaultApplicationEnd: $applicationEnd }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_LECTURE_START = gql`
  mutation UpdateProgramLectureStart($programId: Int!, $lectureStart: date!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { lectureStart: $lectureStart }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_LECTURE_END = gql`
  mutation UpdateProgramLectureEnd($programId: Int!, $lectureEnd: date!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { lectureEnd: $lectureEnd }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_UPLOAD_DEADLINE = gql`
  mutation UpdateProgramUploadDeadline($programId: Int!, $deadline: date!) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { achievementRecordUploadDeadline: $deadline }
    ) {
      id
    }
  }
`;

export const UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE = gql`
  mutation UpdateProgramDefaultProjectSubmissionDeadline(
    $itemId: Int!
    $value: timestamptz
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { defaultProjectSubmissionDeadline: $value }
    ) {
      id
      defaultProjectSubmissionDeadline
    }
  }
`;

export const UPDATE_PROGRAM_DEFAULT_PROJECT_TYPE = gql`
  mutation UpdateProgramDefaultProjectType(
    $itemId: Int!
    $value: String
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { defaultProjectType: $value }
    ) {
      id
      defaultProjectType
    }
  }
`;

export const UPDATE_PROGRAM_PROJECT_PROPOSALS_ENABLED_BY_DEFAULT = gql`
  mutation UpdateProgramProjectProposalsEnabledByDefault(
    $programId: Int!
    $value: Boolean!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $programId }
      _set: { projectProposalsEnabledByDefault: $value }
    ) {
      id
      projectProposalsEnabledByDefault
    }
  }
`;

export const UPDATE_START_QUESTIONAIRE = gql`
  mutation UpdateProgramStartQuestionaire(
    $itemId: Int!
    $text: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { startQuestionnaire: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_SPEAKER_QUESTIONAIRE = gql`
  mutation UpdateProgramSpeakerQuestionaire(
    $itemId: Int!
    $text: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { speakerQuestionnaire: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_ClOSING_QUESTIONAIRE = gql`
  mutation UpdateProgramClosingQuestionaire(
    $itemId: Int!
    $text: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { closingQuestionnaire: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_DEFAULT_ENROLLMENT_SURVEY = gql`
  mutation UpdateProgramDefaultEnrollmentSurvey(
    $itemId: Int!
    $text: String!
  ) {
    update_Program_by_pk(
      pk_columns: { id: $itemId }
      _set: { defaultFormbricksEnrollmentSurveyUrl: $text }
    ) {
      id
    }
  }
`;
