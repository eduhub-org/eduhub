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
          rawAnswer
        }
      }
      survey {
        id
        name
      }
    }
  }
`;

export const GET_FORMBRICKS_ADDON_SELECTIONS = gql`
  query GetFormbricksAddonSelections(
    $courseId: Int!
    $userId: uuid!
    $formbricksSurveyUrl: String!
  ) {
    getFormbricksAddonSelections(
      courseId: $courseId
      userId: $userId
      formbricksSurveyUrl: $formbricksSurveyUrl
    ) {
      success
      error
      messageKey
      selectedAddons {
        id
        description
        validatedPrice
        currency
        questionId
        choiceId
      }
    }
  }
`;

export const CREATE_ENROLLMENT_WITH_ADDONS = gql`
  mutation CreateEnrollmentWithAddons(
    $courseId: Int!
    $userId: uuid!
    $motivationLetter: String
    $formbricksSurveyUrl: String
    $termsAcceptedAt: timestamptz
  ) {
    createEnrollmentWithAddons(
      courseId: $courseId
      userId: $userId
      motivationLetter: $motivationLetter
      formbricksSurveyUrl: $formbricksSurveyUrl
      termsAcceptedAt: $termsAcceptedAt
    ) {
      success
      error
      messageKey
      enrollmentId
      selectedAddons {
        id
        description
        validatedPrice
        currency
        questionId
        choiceId
      }
    }
  }
`;
