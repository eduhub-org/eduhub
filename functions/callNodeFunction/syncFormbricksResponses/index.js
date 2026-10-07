import { GraphQLClient, gql } from 'graphql-request';

import {
  formattedResponsesForEnrollment,
  loadFormbricksSurveyResponses,
  storeQuestionnaireResponse,
  toStoredQuestionnaireResponse,
} from '../lib/formbricksResponses.js';

/**
 * Nightly copy of Formbricks application questionnaire responses into
 * CourseEnrollment.questionnaireResponse, so the applications tab rarely has to
 * ask Formbricks on demand (getFormbricksResponses does that as a fallback and
 * stores the result as well).
 *
 * Runs from the Hasura cron trigger sync_formbricks_responses. Candidates are
 * enrollments without a stored response, or with an unfinished one (the applicant
 * may have completed it since). Each survey is fetched once for all its candidates.
 */

// Enrollments older than this are left to the on-demand path. Without a window,
// enrollments that never had a response would be looked up again every night.
const MAX_AGE_DAYS = 120;
const PAGE_SIZE = 1000;

const GET_CANDIDATES = gql`
  query GetEnrollmentsWithoutQuestionnaireResponse($after: timestamptz!, $limit: Int!, $offset: Int!) {
    CourseEnrollment(
      where: {
        isTest: { _eq: false }
        created_at: { _gte: $after }
        _or: [
          { questionnaireResponse: { _is_null: true } }
          { questionnaireResponse: { _contains: { response: { finished: false } } } }
        ]
        Course: {
          _or: [
            { formbricksEnrollmentSurveyUrl: { _is_null: false } }
            { Program: { defaultFormbricksEnrollmentSurveyUrl: { _is_null: false } } }
          ]
        }
      }
      order_by: [{ created_at: desc }, { id: desc }]
      limit: $limit
      offset: $offset
    ) {
      id
      userId
      courseId
      questionnaireResponse
      Course {
        formbricksEnrollmentSurveyUrl
        Program {
          defaultFormbricksEnrollmentSurveyUrl
        }
      }
    }
  }
`;

/** The survey URL the course's registration uses: its own, or the program default. */
export const effectiveSurveyUrl = (enrollment) =>
  enrollment.Course?.formbricksEnrollmentSurveyUrl ||
  enrollment.Course?.Program?.defaultFormbricksEnrollmentSurveyUrl ||
  null;

/** Groups candidate enrollments by the survey URL to fetch. */
export const groupBySurveyUrl = (enrollments) => {
  const groups = new Map();
  for (const enrollment of enrollments) {
    const url = effectiveSurveyUrl(enrollment);
    if (!url) continue;
    if (!groups.has(url)) groups.set(url, []);
    groups.get(url).push(enrollment);
  }
  return groups;
};

/** Whether the newest response differs from what is stored (new, or a changed one). */
const isNewer = (stored, response) =>
  !stored?.response ||
  stored.response.id !== response.id ||
  stored.response.finished !== response.finished ||
  stored.response.answers?.length !== response.answers.length;

export default async function syncFormbricksResponses(req, logger) {
  logger.info('########## Sync Formbricks Responses ##########');

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });

  const after = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // All pages before storing anything: stored rows leave the filter, which would shift later pages.
  const candidates = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { CourseEnrollment: page } = await client.request(GET_CANDIDATES, { after, limit: PAGE_SIZE, offset });
    candidates.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  const groups = groupBySurveyUrl(candidates);

  let stored = 0;
  let failedSurveys = 0;

  for (const [surveyUrl, enrollments] of groups) {
    let loaded;
    try {
      loaded = await loadFormbricksSurveyResponses(surveyUrl, logger);
    } catch (error) {
      // One broken survey (deleted, wrong URL) must not stop the others.
      failedSurveys += 1;
      logger.error('Failed to load Formbricks survey responses', { surveyUrl, error: error.message });
      continue;
    }

    for (const enrollment of enrollments) {
      const [newest] = formattedResponsesForEnrollment(loaded, {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrollmentId: enrollment.id,
      });
      if (!newest || !isNewer(enrollment.questionnaireResponse, newest)) continue;

      try {
        await storeQuestionnaireResponse(client, enrollment.id, toStoredQuestionnaireResponse(loaded, newest));
        stored += 1;
      } catch (error) {
        logger.error('Failed to store Formbricks response', { enrollmentId: enrollment.id, error: error.message });
      }
    }
  }

  logger.info('Formbricks response sync finished', {
    candidates: candidates.length,
    surveys: groups.size,
    failedSurveys,
    stored,
  });

  return { success: true, candidates: candidates.length, surveys: groups.size, failedSurveys, stored };
}
