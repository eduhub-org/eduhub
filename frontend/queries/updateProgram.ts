import { gql } from "@apollo/client";

export const INSERT_PROGRAM = gql`
    mutation InsertProgram(
        $title: String!
        $today: date!
    ) {
        insert_Program(
            objects: {
                lectureStart: $today
                title: $title
                visibility: false
                visibilityParticipationCertificate: false
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
`

export const DELETE_PROGRAM = gql`
    mutation DeleteProgram(
        $programId: Int!
    ) {
        delete_Program_by_pk(
            id: $programId
        ) {
            id
        }
    }
`

export const UPDATE_PROGRAM_VISIBILITY = gql`
    mutation UpdateProgramVisibility(
        $programId: Int!
        $visible: Boolean!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                visibility: $visible
            }
        ) {
            id
        }
    }
`;

export const UPDATE_PROGRAM_TITLE = gql`
    mutation UpdateProgramTitle(
        $programId: Int!
        $title: String!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                title: $title
            }
        ) {
            id
        }
    }
`;

export const UPDATE_PROGRAM_SHORT_TITLE = gql`
    mutation UpdateProgramShortTitle(
        $programId: Int!
        $shortTitle: String!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                shortTitle: $shortTitle
            }
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
            pk_columns: {id: $programId}
            _set: {
               applicationStart: $applicationStart 
            }
        ) {
            id
        }
    }
`

export const UPDATE_PROGRAM_APPLICATION_END = gql`
    mutation UpdateProgramApplicationEnd(
        $programId: Int!
        $applicationEnd: date!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                defaultApplicationEnd: $applicationEnd
            }
        ) {
            id
        }
    }
`;

export const UPDATE_PROGRAM_LECTURE_START = gql`
    mutation UpdateProgramLectureStart(
        $programId: Int!
        $lectureStart: date!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                lectureStart: $lectureStart
            }
        ) {
            id
        }
    }
`

export const UPDATE_PROGRAM_LECTURE_END = gql`
    mutation UpdateProgramLectureEnd(
        $programId: Int!
        $lectureEnd: date!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                lectureEnd: $lectureEnd
            }
        ) {
            id
        }
    }
`

export const UPDATE_PROGRAM_UPLOAD_DEADLINE = gql`
    mutation UpdateProgramUploadDeadline(
        $programId: Int!
        $deadline: date!
    ) {
        update_Program_by_pk(
            pk_columns: {id: $programId}
            _set: {
                projectRecordUploadDeadline: $deadline
            }
        ) {
            id
        }
    }
`