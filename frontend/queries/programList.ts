import { gql } from "@apollo/client";

import { ADMIN_PROGRAM_FRAGMENT } from "./programFragment";

export const PROGRAM_LIST = gql`
  ${ADMIN_PROGRAM_FRAGMENT}
  query ProgramList {
    Program {
      ...AdminProgramFragment
      Courses {
        id
      }
    }
  }
`;
