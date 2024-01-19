import { gql } from '@apollo/client';

export const LOAD_PARTICIPATION_DATA = gql`
  query loadParticipationData($programId: Int!) {
    loadParticipationData(programId: $programId) {
      link
    }
  }
`;

export const SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE = gql`
  mutation SaveAttendanceCertificateTemplate(
    $base64File: String!
    $fileName: String!
    $programId: Int!
  ) {
    saveAttendanceCertificateTemplate(
      base64file: $base64File
      filename: $fileName
      programid: $programId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE = gql`
  mutation SaveAchievementCertificateTemplate(
    $base64File: String!
    $fileName: String!
    $programId: Int!
  ) {
    saveAchievementCertificateTemplate(
      base64file: $base64File
      filename: $fileName
      programid: $programId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE = gql`
  mutation SaveAchievementOptionDocumentationTemplate(
    $base64File: String!
    $achievementOptionId: Int!
  ) {
    saveAchievementOptionDocumentationTemplate(
      base64file: $base64File
      achievementOptionId: $achievementOptionId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT = gql`
  mutation SaveAchievementOptionEvaluationScript(
    $base64File: String!
    $achievementOptionId: Int!
  ) {
    saveAchievementOptionEvaluationScript(
      base64file: $base64File
      achievementOptionId: $achievementOptionId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE = gql`
  mutation SaveAchievementRecordCoverImage(
    $base64File: String!
    $fileName: String!
    $achievementRecordId: Int!
  ) {
    saveAchievementRecordCoverImage(
      base64file: $base64File
      filename: $fileName
      achievementRecordId: $achievementRecordId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION = gql`
  mutation SaveAchievementRecordDocumentation(
    $base64File: String!
    $fileName: String!
    $achievementRecordId: Int!
  ) {
    saveAchievementRecordDocumentation(
      base64file: $base64File
      filename: $fileName
      achievementRecordId: $achievementRecordId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = gql`
  mutation SaveAchievementDocumentationTemplate(
    $base64File: String!
    $fileName: String!
    $achievementDocumentationTemplateId: Int!
  ) {
    saveAchievementDocumentationTemplate(
      base64file: $base64File
      filename: $fileName
      achievementDocumentationTemplateId: $achievementDocumentationTemplateId
    ) {
      google_link
      path
    }
  }
`;

export const SAVE_COURSE_IMAGE = gql`
  mutation SaveCourseImage(
    $base64File: String!
    $fileName: String!
    $courseId: Int!
  ) {
    saveCourseImage(
      base64file: $base64File
      filename: $fileName
      courseid: $courseId
    ) {
      google_link
      path
    }
  }
`;

export const LOAD_FILE = gql`
  query LoadFile($path: String!) {
    loadFile(path: $path) {
      link
    }
  }
`;

export const SAVE_USER_PROFILE_IMAGE = gql`
  mutation SaveUserProfileImage(
    $base64File: String!
    $fileName: String!
    $userId: String!
  ) {
    saveUserProfileImage(
      base64file: $base64File
      filename: $fileName
      userid: $userId
    ) {
      google_link
      path
    }
  }
`;

export const CREATE_CERTIFICATE = gql`
  mutation createCertificate(
    $userIds: [uuid!]!
    $courseId: Int!
    $certificateType: String!
  ) {
    createCertificate(
      userIds: $userIds
      courseId: $courseId
      certificateType: $certificateType
    ) {
      result
    }
  }
`;
