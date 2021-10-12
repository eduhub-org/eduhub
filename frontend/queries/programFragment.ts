import { gql } from "@apollo/client";

export const PROGRAM_FRAGMENT = gql`
  fragment ProgramFragment on Program {
    defaultApplicationEnd
    applicationStart
    id
    lectureEnd
    lectureStart
    title
    projectRecordUploadDeadline
  }
`;
