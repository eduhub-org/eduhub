import { gql } from '@apollo/client';

export const PROGRAM_FRAGMENT_MINIMUM_PROPERTIES = gql`
  fragment ProgramFragmentMinimumProperties on Program {
    id
    title
    shortTitle
    lectureStart
    lectureEnd
    defaultApplicationEnd
    showExtendedApplicationPeriodBanner
    achievementRecordUploadDeadline
    defaultProjectSubmissionDeadline
    defaultProjectType
    projectProposalsEnabledByDefault
    published
    type
    defaultFormbricksEnrollmentSurveyUrl
  }
`;
export const USER_PROGRAM_FRAGMENT = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  fragment ProgramFragment on Program {
    ...ProgramFragmentMinimumProperties
    defaultApplicationEnd
    applicationStart
    id
    lectureEnd
    lectureStart
    title
    shortTitle
    achievementRecordUploadDeadline
    published
    Organization {
      id
      name
      newsletterDescription
      newsletterProvider
      ghostNewsletterLabel
      ghostNewsletterDoubleOptInEnabled
      ghostNewsletterListId
      ghostNewsletterSlug
    }
  }
`;

export const ADMIN_PROGRAM_FRAGMENT = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  fragment AdminProgramFragment on Program {
    ...ProgramFragmentMinimumProperties
    applicationStart
    closingQuestionnaire
    defaultApplicationEnd
    defaultMaxMissedSessions
    speakerQuestionnaire
    startQuestionnaire
    attendanceCertificateTemplateURL
    achievementCertificateTemplateURL
    visibility
    defaultFormbricksEnrollmentSurveyUrl
    matrixSpaceId
    matrixInstructorRoomId
    showExtendedApplicationPeriodBanner
  }
`;
