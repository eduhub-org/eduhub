import { gql } from '@apollo/client';

export const GET_FORMBRICKS_RESPONSES = gql`
  query GetFormbricksResponses(
    $courseId: Int!
    $userId: uuid!
    $enrollmentId: Int
    $formbricksSurveyUrl: String!
  ) {
    getFormbricksResponses(
      courseId: $courseId
      userId: $userId
      enrollmentId: $enrollmentId
      formbricksSurveyUrl: $formbricksSurveyUrl
    ) {
      success
      error
      responses {
        id
        createdAt
        finished
        answers {
          questionId
          headline
          answer
        }
      }
      survey {
        id
        name
      }
    }
  }
`;

