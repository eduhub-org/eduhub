import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({ request })),
  gql: (strings, ...values) => String.raw(strings, ...values),
}));

const loadFormbricksSurveyResponses = jest.fn();
const actual = await import('../lib/formbricksResponses.js');
jest.unstable_mockModule('../lib/formbricksResponses.js', () => ({
  ...actual,
  loadFormbricksSurveyResponses,
}));

process.env.HASURA_ENDPOINT = 'http://hasura.test/v1/graphql';
process.env.HASURA_ADMIN_SECRET = 'test-secret';

const { default: getFormbricksResponses } = await import('../getFormbricksResponses/index.js');

const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const SURVEY_URL = 'https://forms.example/s/a';
const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const call = (input) =>
  getFormbricksResponses(
    { body: { input: { courseId: 42, userId: USER_ID, formbricksSurveyUrl: SURVEY_URL, ...input }, session_variables: { 'x-hasura-role': 'instructor_access' } } },
    logger
  );

const answerEnrollment = (enrollment) =>
  request.mockImplementation(async (document) => {
    if (document.includes('query GetEnrollmentForQuestionnaire')) return { CourseEnrollment_by_pk: enrollment };
    return { update_CourseEnrollment_by_pk: { id: 7 } };
  });

const stores = () => request.mock.calls.filter(([document]) => document.includes('mutation'));

describe('getFormbricksResponses', () => {
  beforeEach(() => {
    request.mockReset();
    loadFormbricksSurveyResponses.mockResolvedValue({
      survey: { id: 'a', name: 'S' },
      surveyUrl: SURVEY_URL,
      questionDescriptors: [{ questionId: 'q1', responseKeys: ['q1'], headline: 'Q1', type: 'openText', order: 0 }],
      responses: [
        { id: 'r1', createdAt: '2026-10-01T10:00:00.000Z', finished: true, data: { eduhubUserId: USER_ID, eduhubCourseId: '42', q1: 'yes' } },
      ],
    });
  });

  it('returns the responses and stores the newest one on the enrollment', async () => {
    answerEnrollment({ id: 7, userId: USER_ID, courseId: 42 });

    const result = await call({ enrollmentId: 7 });

    expect(result.success).toBe(true);
    expect(result.responses[0].answers[0]).toMatchObject({ headline: 'Q1', questionType: 'openText', answer: 'yes' });
    expect(stores()).toHaveLength(1);
    expect(stores()[0][1]).toMatchObject({ id: 7, questionnaireResponse: { provider: 'formbricks', response: { id: 'r1' } } });
  });

  it('does not store on an enrollment of another user or course', async () => {
    answerEnrollment({ id: 7, userId: 'someone-else', courseId: 42 });
    expect((await call({ enrollmentId: 7 })).success).toBe(true);

    answerEnrollment({ id: 7, userId: USER_ID, courseId: 43 });
    expect((await call({ enrollmentId: 7 })).success).toBe(true);

    expect(stores()).toHaveLength(0);
  });

  it('does not store without an enrollment id', async () => {
    answerEnrollment({ id: 7, userId: USER_ID, courseId: 42 });
    await call({});
    expect(request).not.toHaveBeenCalled();
  });

  it('answers with the messageKey of an invalid survey URL', async () => {
    loadFormbricksSurveyResponses.mockRejectedValue(new actual.FormbricksResponsesError('bad', 'INVALID_SURVEY_URL'));
    expect(await call({})).toEqual({ success: false, error: 'bad', messageKey: 'INVALID_SURVEY_URL' });
  });
});
