import { gql } from "@apollo/client";

export const CREATE_STRIPE_CHECKOUT = gql`
  mutation CreateStripeCheckout(
    $courseId: Int!
    $enrollmentId: Int!
    $formbricksResponseId: String
    $successUrl: String!
    $cancelUrl: String!
    $userEmail: String
    $course: CourseInput
    $addonMappings: [AddonMappingInput!]
    $selectedAddons: [SelectedAddonInput!]
  ) {
    createStripeCheckout(
      courseId: $courseId
      enrollmentId: $enrollmentId
      formbricksResponseId: $formbricksResponseId
      successUrl: $successUrl
      cancelUrl: $cancelUrl
      userEmail: $userEmail
      course: $course
      addonMappings: $addonMappings
      selectedAddons: $selectedAddons
    ) {
      success
      checkoutUrl
      sessionId
      error
      messageKey
    }
  }
`;

export const VALIDATE_FORMBRICKS_SURVEY = gql`
  mutation ValidateFormbricksSurvey(
    $surveyUrl: String!
    $courseId: Int!
  ) {
    validateFormbricksSurvey(
      surveyUrl: $surveyUrl
      courseId: $courseId
    ) {
      success
      surveyId
      surveyTitle
      addonQuestions {
        questionId
        choiceId
        questionType
        questionText
        extractedPrice
        extractedCurrency
        confidence
        warnings {
          type
          message
          severity
        }
        allDetectedPrices {
          language
          priceInCents
          currency
          originalText
        }
        description
      }
      requiresReview
      error
      messageKey
    }
  }
`;

export const SAVE_ADDON_MAPPINGS = gql`
  mutation SaveAddonMappings(
    $courseId: Int!
    $mappings: [AddonMappingInput!]!
  ) {
    saveAddonMappings(
      courseId: $courseId
      mappings: $mappings
    ) {
      success
      messageKey
      error
      stripeResults {
        success
        results {
          questionId
          stripeProductId
          stripePriceId
          success
          error
        }
        summary {
          total
          success
          failures
        }
      }
    }
  }
`;

export const GET_COURSE_ADDON_MAPPINGS = gql`
  query GetCourseAddonMappings($courseId: Int!) {
    CourseAddonMapping(where: { courseId: { _eq: $courseId } }) {
      id
      courseId
      questionId
      questionTextDe
      questionTextEn
      extractedPrice
      validatedPrice
      currency
      description
      stripeProductId
      stripePriceId
      confidence
      validatedAt
      validatedBy
      created_at
      updated_at
    }
  }
`;

