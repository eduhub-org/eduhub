/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetFaqsByCollectionAndLang
// ====================================================

export interface GetFaqsByCollectionAndLang_FaqCollection_Faqs_FaqTranslations {
  __typename: "FaqTranslation";
  id: number;
  lang: string;
  question: string;
  answer: string;
}

export interface GetFaqsByCollectionAndLang_FaqCollection_Faqs_FaqTranslations_fallback {
  __typename: "FaqTranslation";
  id: number;
  lang: string;
  question: string;
  answer: string;
}

export interface GetFaqsByCollectionAndLang_FaqCollection_Faqs {
  __typename: "Faq";
  id: number;
  /**
   * An array relationship
   */
  FaqTranslations: GetFaqsByCollectionAndLang_FaqCollection_Faqs_FaqTranslations[];
  /**
   * An array relationship
   */
  FaqTranslations_fallback: GetFaqsByCollectionAndLang_FaqCollection_Faqs_FaqTranslations_fallback[];
}

export interface GetFaqsByCollectionAndLang_FaqCollection {
  __typename: "FaqCollection";
  id: number;
  name: string;
  /**
   * An array relationship
   */
  Faqs: GetFaqsByCollectionAndLang_FaqCollection_Faqs[];
}

export interface GetFaqsByCollectionAndLang {
  /**
   * fetch data from the table: "FaqCollection"
   */
  FaqCollection: GetFaqsByCollectionAndLang_FaqCollection[];
}

export interface GetFaqsByCollectionAndLangVariables {
  collection: string;
  lang: string;
}
