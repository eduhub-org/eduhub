import { gql } from '@apollo/client';

export const LOAD_ATTENDANCE_CERTIFICATE = gql`
  query loadAttendanceCertificate($path: String!) {
    loadAttendanceCertificate(path: $path) {
      link
    }
  }
`;
