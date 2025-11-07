import { gql } from '@apollo/client';

export const LOAD_PARTICIPATION_DATA = gql`
  query loadParticipationData($programId: Int!) {
    loadParticipationData(programId: $programId) {
      success
      link
      error
      messageKey
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
      success
      messageKey
      error
      filePath
      accessUrl
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
      success
      messageKey
      error
      filePath
      accessUrl
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
      success
      messageKey
      error
      filePath
      accessUrl
      resizedPaths {
        size
        filePath
        accessUrl
      }
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
      success
      messageKey
      error
      filePath
      accessUrl
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
      success
      messageKey
      error
      filePath
      accessUrl
    }
  }
`;

export const GET_SIGNED_URL = gql`
  query GetSignedUrl($path: String!) {
    getSignedUrl(path: $path) {
      link
    }
  }
`;

export const MAKE_CERTIFICATE_PUBLIC = gql`
  query MakeCertificatePublic($certificatePath: String!) {
    makeCertificatePublic(certificatePath: $certificatePath) {
      success
      messageKey
      error
      publicUrl
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
      success
      messageKey
      error
      filePath
      accessUrl
      resizedPaths {
        size
        filePath
        accessUrl
      }
    }
  }
`;

export const SAVE_ORGANIZATION_LOGO = gql`
  mutation SaveOrganizationLogo(
    $base64File: String!
    $fileName: String!
    $organizationId: Int!
  ) {
    saveOrganizationLogo(
      base64file: $base64File
      filename: $fileName
      organizationid: $organizationId
    ) {
      success
      messageKey
      error
      filePath
      accessUrl
      resizedPaths {
        size
        filePath
        accessUrl
      }
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
      success
      messageKey
      error
      filePath
      accessUrl
      resizedPaths {
        size
        filePath
        accessUrl
      }
    }
  }
`;

export const CREATE_CERTIFICATES = gql`
  mutation createCertificates(
    $userIds: [uuid!]!
    $courseId: Int!
    $certificateType: String!
  ) {
    createCertificates(
      userIds: $userIds
      courseId: $courseId
      certificateType: $certificateType
    ) {
      success
      count
      certificateType
      error
      messageKey
    }
  }
`;

export const ADMIN_USERS = gql`
  query AdminUsers {
    getAdminUsers {
      success
      adminUserIds
      messageKey
      error
    }
  }
`;

export const UPDATE_USER_ADMIN_STATUS = gql`
  mutation UpdateUserAdminStatus($userId: String!, $isAdmin: Boolean!) {
    updateUserAdminStatus(userId: $userId, isAdmin: $isAdmin) {
      success
      error
      messageKey
    }
  }
`;

export const SEND_SESSION_REMINDERS = gql`
  mutation SendSessionReminders {
    sendSessionReminders {
      success
      messageKey
      error
      totalEmailsSent
      processedSessions {
        sessionId
        sessionTitle
        reminderType
        emailsSent
      }
      processedAt
    }
  }
`;
