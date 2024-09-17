import { graphql } from '../../../types/generated';

export const PROGRAM_LIST = graphql(`
  query ProgramList {
    Program {
      ...AdminProgramFragment
      Courses {
        id
      }
    }
  }
`);

export const PROGRAMS_WITH_MINIMUM_PROPERTIES = graphql(`
  query Programs {
    Program(order_by: { id: desc }) {
      ...ProgramFragmentMinimumProperties
    }
  }
`);
