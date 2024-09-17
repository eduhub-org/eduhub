import { graphql } from '../../types/generated';

export const LOAD_PARTICIPATION_DATA = graphql(`
  query loadParticipationData($programId: Int!) {
    loadParticipationData(programId: $programId) {
      link
    }
  }
`);

export const SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE = graphql(`
  mutation SaveAttendanceCertificateTemplate($base64File: String!, $fileName: String!, $programId: Int!) {
    saveAttendanceCertificateTemplate(base64file: $base64File, filename: $fileName, programid: $programId) {
      file_path
      google_link
    }
  }
`);

export const SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE = graphql(`
  mutation SaveAchievementCertificateTemplate($base64File: String!, $fileName: String!, $programId: Int!) {
    saveAchievementCertificateTemplate(base64file: $base64File, filename: $fileName, programid: $programId) {
      file_path
      google_link
    }
  }
`);

export const SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE = graphql(`
  mutation SaveAchievementRecordCoverImage($base64File: String!, $fileName: String!, $achievementRecordId: Int!) {
    saveAchievementRecordCoverImage(
      base64file: $base64File
      filename: $fileName
      achievementRecordId: $achievementRecordId
    ) {
      file_path
      google_link
    }
  }
`);

export const SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION = graphql(`
  mutation SaveAchievementRecordDocumentation($base64File: String!, $fileName: String!, $achievementRecordId: Int!) {
    saveAchievementRecordDocumentation(
      base64file: $base64File
      filename: $fileName
      achievementRecordId: $achievementRecordId
    ) {
      file_path
      google_link
    }
  }
`);

export const SAVE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = graphql(`
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
      file_path
      google_link
    }
  }
`);

export const GET_SIGNED_URL = graphql(`
  query GetSignedUrl($path: String!) {
    getSignedUrl(path: $path) {
      link
    }
  }
`);

export const SAVE_USER_PROFILE_IMAGE = graphql(`
  mutation SaveUserProfileImage($base64File: String!, $fileName: String!, $userId: String!) {
    saveUserProfileImage(base64file: $base64File, filename: $fileName, userid: $userId) {
      file_path
      google_link
    }
  }
`);

export const SAVE_COURSE_IMAGE = graphql(`
  mutation SaveCourseImage($base64File: String!, $fileName: String!, $courseId: Int!) {
    saveCourseImage(base64file: $base64File, filename: $fileName, courseid: $courseId) {
      file_path
      google_link
    }
  }
`);

export const CREATE_CERTIFICATE = graphql(`
  mutation createCertificate($userIds: [uuid!]!, $courseId: Int!, $certificateType: String!) {
    createCertificate(userIds: $userIds, courseId: $courseId, certificateType: $certificateType) {
      result
    }
  }
`);

export const CREATE_CERTIFICATES = graphql(`
  mutation createCertificates($userIds: [uuid!]!, $courseId: Int!, $certificateType: String!) {
    createCertificate(userIds: $userIds, courseId: $courseId, certificateType: $certificateType) {
      result
    }
  }
`);
