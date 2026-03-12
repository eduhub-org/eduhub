/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetFormbricksResponses
// ====================================================

export interface GetFormbricksResponses_getFormbricksResponses_responses_answers {
  __typename: "FormbricksAnswer";
  questionId: string;
  headline: string;
  answer: string;
  rawAnswer: string | null;
}

export interface GetFormbricksResponses_getFormbricksResponses_responses {
  __typename: "FormbricksResponse";
  id: string;
  createdAt: string;
  finished: boolean;
  answers: GetFormbricksResponses_getFormbricksResponses_responses_answers[];
}

export interface GetFormbricksResponses_getFormbricksResponses_survey {
  __typename: "FormbricksSurvey";
  id: string;
  name: string;
}

export interface GetFormbricksResponses_getFormbricksResponses {
  __typename: "GetFormbricksResponsesResult";
  success: boolean;
  error: string | null;
  responses: GetFormbricksResponses_getFormbricksResponses_responses[] | null;
  survey: GetFormbricksResponses_getFormbricksResponses_survey | null;
}

export interface GetFormbricksResponses {
  /**
   * Fetches Formbricks survey responses for a course enrollment
   */
  getFormbricksResponses: GetFormbricksResponses_getFormbricksResponses;
}

export interface GetFormbricksResponsesVariables {
  courseId: number;
  userId: any;
  enrollmentId?: number | null;
  formbricksSurveyUrl: string;
}
