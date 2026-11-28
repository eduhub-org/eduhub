/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SemanticProjectSearch
// ====================================================

export interface SemanticProjectSearch_semanticProjectSearch_matches {
  __typename: "ProjectMatchResult";
  projectId: number;
  similarity: number;
}

export interface SemanticProjectSearch_semanticProjectSearch {
  __typename: "SemanticProjectSearchResult";
  success: boolean;
  enabled: boolean;
  matches: SemanticProjectSearch_semanticProjectSearch_matches[];
}

export interface SemanticProjectSearch {
  /**
   * Projects closest in meaning to a search (title, tagline, description), for the projects overview (ADR 0009). Admins and org admins.
   */
  semanticProjectSearch: SemanticProjectSearch_semanticProjectSearch;
}

export interface SemanticProjectSearchVariables {
  query: string;
}
