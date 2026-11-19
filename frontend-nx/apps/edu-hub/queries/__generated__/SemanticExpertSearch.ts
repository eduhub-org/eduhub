/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SemanticExpertSearch
// ====================================================

export interface SemanticExpertSearch_semanticExpertSearch_matches {
  __typename: "ExpertRoleMatchResult";
  sourceType: string;
  sourceId: number;
  similarity: number;
}

export interface SemanticExpertSearch_semanticExpertSearch {
  __typename: "SemanticExpertSearchResult";
  success: boolean;
  enabled: boolean;
  matches: SemanticExpertSearch_semanticExpertSearch_matches[];
}

export interface SemanticExpertSearch {
  /**
   * Expert Role sources (courses, sessions, projects, achievement options) closest in meaning to a search, for the expert directory (ADR 0004). Admins and org admins.
   */
  semanticExpertSearch: SemanticExpertSearch_semanticExpertSearch;
}

export interface SemanticExpertSearchVariables {
  query: string;
}
