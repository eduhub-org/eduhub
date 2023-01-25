import { gql } from '@apollo/client';

export const PROGRAM_FRAGMENT_MINIMUM_PROPERTIES = gql`
  fragment ProgramFragmentMinimumProperties on Program {
    id
    title
    shortTitle
    lectureStart
    lectureEnd
    achievementRecordUploadDeadline
    visibility
  }
`;
export const USER_PROGRAM_FRAGMENT = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  fragment ProgramFragment on Program {
    ...ProgramFragmentMinimumProperties
    defaultApplicationEnd
    applicationStart
  }
`;

export const ADMIN_PROGRAM_FRAGMENT = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  fragment AdminProgramFragment on Program {
    ...ProgramFragmentMinimumProperties
    applicationStart
    attendanceCertificateTemplateURL
    closingQuestionnaire
    defaultApplicationEnd
    defaultMaxMissedSessions
    participationCertificateTemplateURL
    speakerQuestionnaire
    startQuestionnaire
    visibilityAchievementCertificate
    visibilityParticipationCertificate
  }
`;
