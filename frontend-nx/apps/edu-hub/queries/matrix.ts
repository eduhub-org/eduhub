import { gql } from "@apollo/client";

export const CREATE_MATRIX_ROOM = gql`
  mutation CreateMatrixRoom(
    $courseId: Int!
    $roomName: String!
    $topic: String
    $spaceName: String
  ) {
    createMatrixRoom(
      courseId: $courseId
      roomName: $roomName
      topic: $topic
      spaceName: $spaceName
    ) {
      success
      messageKey
      spaceId
      roomId
      chatLink
      alreadyExists
      error
    }
  }
`;
