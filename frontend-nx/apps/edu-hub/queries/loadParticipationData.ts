import { gql } from '@apollo/client';

export const LOAD_PARTICIPATION_DATA = gql`
  query loadParticipationData($programId: Int!) {
    loadParticipationData(programId: $programId) {
      link
    }
  }
`;
