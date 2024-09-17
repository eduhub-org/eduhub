import { graphql } from '../../types/generated';

export const INSERT_PROGRAM = graphql(`
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
        visibilityAttendanceCertificate: false
        visibilityAchievementCertificate: false
        defaultMaxMissedSessions: 2
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`);

export const DELETE_PROGRAM = graphql(`
  mutation DeleteProgram($programId: Int!) {
    delete_Program_by_pk(id: $programId) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_VISIBILITY = graphql(`
  mutation UpdateProgramVisibility($programId: Int!, $visible: Boolean!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { visibility: $visible }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_PUBLISHED = graphql(`
  mutation UpdateProgramPublished($programId: Int!, $published: Boolean!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { published: $published }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_TITLE = graphql(`
  mutation UpdateProgramTitle($programId: Int!, $title: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { title: $title }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_SHORT_TITLE = graphql(`
  mutation UpdateProgramShortTitle($programId: Int!, $shortTitle: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { shortTitle: $shortTitle }) {
      id
    }
  }
`);

export const UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE = graphql(`
  mutation UpdateProgramParticipationTemplate($programId: Int!, $templatePath: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { attendanceCertificateTemplateURL: $templatePath }) {
      id
    }
  }
`);

export const UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE = graphql(`
  mutation UpdateProgramAchievementTemplate($programId: Int!, $templatePath: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { achievementCertificateTemplateURL: $templatePath }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_APPLICATION_START = graphql(`
  mutation UpdateProgramApplicationStart($programId: Int!, $applicationStart: date!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { applicationStart: $applicationStart }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_APPLICATION_END = graphql(`
  mutation UpdateProgramApplicationEnd($programId: Int!, $applicationEnd: date!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { defaultApplicationEnd: $applicationEnd }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_LECTURE_START = graphql(`
  mutation UpdateProgramLectureStart($programId: Int!, $lectureStart: date!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { lectureStart: $lectureStart }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_LECTURE_END = graphql(`
  mutation UpdateProgramLectureEnd($programId: Int!, $lectureEnd: date!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { lectureEnd: $lectureEnd }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_UPLOAD_DEADLINE = graphql(`
  mutation UpdateProgramUploadDeadline($programId: Int!, $deadline: date!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { achievementRecordUploadDeadline: $deadline }) {
      id
    }
  }
`);

export const UPDATE_START_QUESTIONAIRE = graphql(`
  mutation UpdateProgramStartQuestionaire($programId: Int!, $questionaire: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { startQuestionnaire: $questionaire }) {
      id
    }
  }
`);

export const UPDATE_SPEAKER_QUESTIONAIRE = graphql(`
  mutation UpdateProgramSpeakerQuestionaire($programId: Int!, $questionaire: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { speakerQuestionnaire: $questionaire }) {
      id
    }
  }
`);

export const UPDATE_ClOSING_QUESTIONAIRE = graphql(`
  mutation UpdateProgramClosingQuestionaire($programId: Int!, $questionaire: String!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { closingQuestionnaire: $questionaire }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE = graphql(`
  mutation UpdateProgramAchievementCertVisible($programId: Int!, $isVisible: Boolean!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { visibilityAchievementCertificate: $isVisible }) {
      id
    }
  }
`);

export const UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE = graphql(`
  mutation UpdateProgramParticipationCertVisible($programId: Int!, $isVisible: Boolean!) {
    update_Program_by_pk(pk_columns: { id: $programId }, _set: { visibilityAttendanceCertificate: $isVisible }) {
      id
    }
  }
`);
