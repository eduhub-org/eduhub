import { gql } from "@apollo/client";

import {
  ADMIN_PROGRAM_FRAGMENT,
  PROGRAM_FRAGMENT_MINIMUM_PROPERTIES,
} from "./programFragment";

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

export const PROGRAMS_WITH_MINIMUM_PROPERTIES = gql`
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query Programs {
    Program(order_by: { id: desc }) {
      ...ProgramFragmentMinimumProperties
    }
  }
`;
