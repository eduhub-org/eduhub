import { gql } from "@apollo/client";

export const USER_PROGRAM_FRAGMENT = gql`
  fragment ProgramFragment on Program {
    defaultApplicationEnd
    applicationStart
    id
    lectureEnd
    lectureStart
    title
    projectRecordUploadDeadline
  }
`;

export const ADMIN_PROGRAM_FRAGMENT = gql`
  fragment AdminProgramFragment on Program {
    id
    applicationStart
    attendanceCertificateTemplateURL
    closingQuestionnaire
    defaultApplicationEnd
    defaultMaxMissedSessions
    lectureEnd
    lectureStart
    participationCertificateTemplateURL
    projectRecordUploadDeadline
    shortTitle
    speakerQuestionnaire
    startQuestionnaire
    title
    visibility
    visibilityAchievementCertificate
    visibilityParticipationCertificate
  }
`;

export const PROGRAM_FRAGMENT_MINIMUM_PROPERTIES = gql`
  fragment ProgramFragmentMinimumProperties on Program {
    id
    shortTitle
    title
  }
`;
