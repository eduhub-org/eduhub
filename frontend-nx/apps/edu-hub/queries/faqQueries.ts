import { gql } from "@apollo/client";
import { GetFaqsByCollectionAndLang, GetFaqsByCollectionAndLangVariables } from "./__generated__/GetFaqsByCollectionAndLang";

export const GET_FAQS_BY_COLLECTION_AND_LANG = gql`
  query GetFaqsByCollectionAndLang($collection: String!, $lang: String!) {
    FaqCollection(where: {name: {_eq: $collection}}) {
      id
      name
      Faqs(order_by: {created_at: asc}) {
        id
        FaqTranslations(where: {lang: {_eq: $lang}}) {
          id
          lang
          question
          answer
        }
        FaqTranslations_fallback: FaqTranslations(where: {lang: {_eq: "EN"}}, limit: 1) {
          id
          lang
          question
          answer
        }
      }
    }
  }
`;

// Export generated types for consumers
export type { GetFaqsByCollectionAndLang, GetFaqsByCollectionAndLangVariables };