import { gql } from '@apollo/client';

export const LOAD_PARTICIPATION_CERTIFICATE = gql`
  query loadParticipationCertificate($path: String!) {
    loadParticipationCertificate(path: $path) {
      link
    }
  }
`;
