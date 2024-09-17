import { graphql } from '../../types/generated';

export const PROGRAM_FRAGMENT_MINIMUM_PROPERTIES = graphql(`
  fragment ProgramFragmentMinimumProperties on Program {
    id
    title
    shortTitle
    lectureStart
    lectureEnd
    defaultApplicationEnd
    achievementRecordUploadDeadline
    published
    visibilityAchievementCertificate
    visibilityAttendanceCertificate
  }
`);

export const USER_PROGRAM_FRAGMENT = graphql(`
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
    visibilityAchievementCertificate
    visibilityAttendanceCertificate
  }
`);

export const ADMIN_PROGRAM_FRAGMENT = graphql(`
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
    visibilityAchievementCertificate
    visibilityAttendanceCertificate
  }
`);
