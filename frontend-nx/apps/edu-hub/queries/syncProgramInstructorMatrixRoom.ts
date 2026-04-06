import { gql } from '@apollo/client';

export const SYNC_PROGRAM_INSTRUCTOR_MATRIX_ROOM = gql`
  mutation SyncProgramInstructorMatrixRoom($programId: Int!) {
    syncProgramInstructorMatrixRoom(programId: $programId) {
      success
      messageKey
      invitedCount
      skippedCount
      details
      error
    }
  }
`;
