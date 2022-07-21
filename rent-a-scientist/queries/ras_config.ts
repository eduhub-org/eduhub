import { gql } from "@apollo/client";

export interface RSAConfig {
  programId: number,
  start: Date,
  end: Date
}

export const QUERY_RSA_CONFIG = gql`
  query QueryRSAConfig {
    RentAScientistConfig_by_pk(id: 1) {
      program_id
      Program {
        lectureStart
        lectureEnd
      }
    }
  }
`;