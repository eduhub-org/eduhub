import { gql } from '@apollo/client';

export const ONBOARDING_TEXTS = gql`
  query OnboardingTexts {
    OnboardingText(order_by: [{ programType: asc }, { lang: asc }]) {
      id
      programType
      lang
      text
    }
  }
`;

export const ONBOARDING_TEXT_BY_TYPE = gql`
  query OnboardingTextByType($programType: ProgramType_enum!) {
    OnboardingText(where: { programType: { _eq: $programType } }) {
      id
      programType
      lang
      text
    }
  }
`;

export const UPDATE_ONBOARDING_TEXT = gql`
  mutation UpdateOnboardingText($itemId: Int!, $text: String!) {
    update_OnboardingText_by_pk(pk_columns: { id: $itemId }, _set: { text: $text }) {
      id
      text
    }
  }
`;
