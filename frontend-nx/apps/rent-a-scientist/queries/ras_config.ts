import { gql } from '@apollo/client';

export interface RSAConfig {
  programId: number;
  start: Date;
  end: Date;
  dateLoaded: boolean;
  visibility: boolean;
  test_operation: boolean;
  fromMail?: string;
}

export const QUERY_RSA_CONFIG = gql`
  query QueryRSAConfig {
    RentAScientistConfig_by_pk(id: 1) {
      program_id
      test_operation
      mailFrom
      Program {
        lectureStart
        lectureEnd
        visibility
      }
    }
  }
`;
