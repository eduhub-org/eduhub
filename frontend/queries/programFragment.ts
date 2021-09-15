import { gql } from "@apollo/client";

export const PROGRAM_FRAGMENT = gql`
  fragment ProgramFragment on Program {
    ApplicationEnd
    ApplicationStart
    Id
    End
    Start
    Name
    PerformanceRecordDeadline
  }
`;
