import { gql } from "@apollo/client";

export const CREATE_STRIPE_CHECKOUT = gql`
  mutation CreateStripeCheckout(
    $courseId: Int!
    $enrollmentId: Int!
    $formbricksResponseId: String
    $userEmail: String
    $course: CourseInput
    $addonMappings: [AddonMappingInput!]
    $selectedAddons: [SelectedAddonInput!]
  ) {
    createStripeCheckout(
      courseId: $courseId
      enrollmentId: $enrollmentId
      formbricksResponseId: $formbricksResponseId
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
          choiceId
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

export const CREATE_STRIPE_BASE_PRICE = gql`
  mutation CreateStripeBasePrice(
    $courseId: Int!
    $basePrice: Int!
    $currency: String
    $courseTitle: String
  ) {
    createStripeBasePrice(
      courseId: $courseId
      basePrice: $basePrice
      currency: $currency
      courseTitle: $courseTitle
    ) {
      success
      messageKey
      stripeProductId
      stripePriceId
      productName
      priceAmount
      currency
      error
    }
  }
`;

export const GET_COURSE_ADDON_MAPPINGS = gql`
  query GetCourseAddonMappings($courseId: Int!) {
    CourseAddonMapping(where: { courseId: { _eq: $courseId } }) {
      id
      courseId
      questionId
      choiceId
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

