import { gql } from "@apollo/client";

export const QUERY_ACTIVE_PROGRAM_ID = gql`
  query QueryActiveProgramId {
    RentAScientistConfig_by_pk(id: 1) {
      program_id
    }
  }
`;
