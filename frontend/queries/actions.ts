import { gql } from "@apollo/client";

// I am pretty sure the current loadFile/saveFile implementation is still broken,
// I can't get it to work at all

// I think the following concept would be reasonable and will implement the UI to use it:

// - the saveFile mutation is given the base64 encoded data and the full path of the file
// - if the path starts with public it can afterwards be accessed directly using the bucket_url + the path
// - if the path does not start with public the UI needs to call loadFile with the full path of the file
// - loadFile then returns the full URL with a token parameter to access the data, but only if the current user
// is allowed to access the data

export const SAVE_ACHIEVEMENT_CERTIFICATE = gql`
  mutation SaveAchievementCertificate(
    $base64File: String!
    $courseId: Int!
    $userId: String!
  ) {
    saveAchievementCertificate(
      base64file: $base64File
      courseid: $courseId
      userid: $userId
    ) {
      link
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
      link
    }
  }
`;

export const SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE = gql`
  mutation SaveAchievementOptionDocumentationTemplate(
    $base64File: String!
    $courseId: Int!
  ) {
    saveAchievementOptionDocumentationTemplate(
      base64file: $base64File
      courseid: $courseId
    ) {
      link
    }
  }
`;

export const SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT = gql`
  mutation SaveAchievementOptionEvaluationScript(
    $base64File: String!
    $courseId: Int!
  ) {
    saveAchievementOptionEvaluationScript(
      base64file: $base64File
      courseid: $courseId
    ) {
      link
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
      link
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
      link
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
      link
    }
  }
`;
export const SAVE_PARTICIPATION_CERTIFICATE_TEMPLATE = gql`
  mutation SaveParticipationCertificateTemplate(
    $base64File: String!
    $fileName: String!
    $programId: Int!
  ) {
    saveParticipationCertificateTemplate(
      base64file: $base64File
      filename: $fileName
      programid: $programId
    ) {
      link
    }
  }
`;
export const LOAD_FILE = gql`
  query LoadAFile($path: String!) {
    loadAchievementCertificate(path: $path) {
      link
    }
  }
`;
