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

const { default: syncFormbricksResponses } = await import('../syncFormbricksResponses/index.js');

const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const URL_A = 'https://forms.example/s/a';
const URL_B = 'https://forms.example/s/b';

const enrollment = (id, userId, courseUrl, programUrl, questionnaireResponse = null) => ({
  id,
  created_at: '2026-10-01T00:00:00.000Z',
  userId,
  courseId: 42,
  questionnaireResponse,
  Course: { formbricksEnrollmentSurveyUrl: courseUrl, Program: { defaultFormbricksEnrollmentSurveyUrl: programUrl } },
});

const raw = (id, userId, finished = true) => ({
  id,
  createdAt: '2026-10-01T10:00:00.000Z',
  finished,
  data: { eduhubUserId: userId, eduhubCourseId: '42', q1: 'answer' },
});

const loaded = (url, responses) => ({
  survey: { id: url, name: 'S' },
  surveyUrl: url,
  questionDescriptors: [{ questionId: 'q1', responseKeys: ['q1'], headline: 'Q1', type: 'openText', order: 0 }],
  responses,
});

const storedIds = () =>
  request.mock.calls
    .filter(([document]) => document.includes('mutation UpdateEnrollmentQuestionnaireResponse'))
    .map(([, variables]) => variables.id);

describe('syncFormbricksResponses', () => {
  beforeEach(() => {
    request.mockReset();
    loadFormbricksSurveyResponses.mockReset();
  });

  it('fetches each survey once and stores new or changed responses only', async () => {
    const unchangedStored = {
      provider: 'formbricks',
      response: { id: 'r3', finished: false, answers: [{ questionId: 'q1', answer: 'answer' }] },
    };
    // Same response, still unfinished, but the applicant changed an answer since.
    const changedStored = {
      provider: 'formbricks',
      response: { id: 'r7', finished: false, answers: [{ questionId: 'q1', answer: 'old answer' }] },
    };
    request.mockImplementation(async (document) => {
      if (document.includes('query GetEnrollmentsWithoutQuestionnaireResponse')) {
        return {
          CourseEnrollment: [
            enrollment(1, 'u1', URL_A, null),
            enrollment(2, 'u2', null, URL_A), // program default
            enrollment(3, 'u3', URL_B, URL_A, unchangedStored), // course URL wins
            enrollment(4, 'u4', URL_B, null), // no response yet
            enrollment(7, 'u7', URL_B, null, changedStored),
          ],
        };
      }
      return { update_CourseEnrollment_by_pk: { id: 1 } };
    });
    loadFormbricksSurveyResponses.mockImplementation(async (url) =>
      url === URL_A
        ? loaded(URL_A, [raw('r1', 'u1'), raw('r2', 'u2')])
        : loaded(URL_B, [raw('r3', 'u3', false), raw('r7', 'u7', false)])
    );

    const result = await syncFormbricksResponses({ body: {} }, logger);

    expect(loadFormbricksSurveyResponses).toHaveBeenCalledTimes(2);
    expect(storedIds()).toEqual([1, 2, 7]);
    expect(result).toEqual({ success: true, candidates: 5, surveys: 2, failedSurveys: 0, stored: 3 });
  });

  it('re-stores an unfinished response once it is finished, and survives a broken survey', async () => {
    request.mockImplementation(async (document) => {
      if (document.includes('query GetEnrollmentsWithoutQuestionnaireResponse')) {
        return {
          CourseEnrollment: [
            enrollment(5, 'u5', URL_A, null, { response: { id: 'r5', finished: false, answers: [{}] } }),
            enrollment(6, 'u6', URL_B, null),
          ],
        };
      }
      return {};
    });
    loadFormbricksSurveyResponses.mockImplementation(async (url) => {
      if (url === URL_B) throw new Error('survey deleted');
      return loaded(URL_A, [raw('r5', 'u5', true)]);
    });

    const result = await syncFormbricksResponses({ body: {} }, logger);

    expect(storedIds()).toEqual([5]);
    expect(result.failedSurveys).toBe(1);
    const stored = request.mock.calls.find(([d]) => d.includes('mutation'))[1].questionnaireResponse;
    expect(stored.provider).toBe('formbricks');
    expect(stored.response.finished).toBe(true);
  });
  it('pages by (created_at, id) so rows that leave the filter meanwhile skip nobody', async () => {
    // 1003 candidates, newest first; pairs share a created_at so the id tie-break matters.
    let rows = Array.from({ length: 1003 }, (_, i) => ({
      ...enrollment(1003 - i, `u${1003 - i}`, URL_A, null),
      created_at: new Date(Date.UTC(2026, 9, 1) - Math.floor(i / 2) * 60000).toISOString(),
    }));
    const pages = [];
    request.mockImplementation(async (document, variables) => {
      if (!document.includes('query GetEnrollmentsWithoutQuestionnaireResponse')) return {};
      pages.push(variables.page);
      const cursor = variables.page._or;
      const after = cursor
        ? rows.filter(
            (r) =>
              r.created_at < cursor[0].created_at._lt ||
              (r.created_at === cursor[1]._and[0].created_at._eq && r.id < cursor[1]._and[1].id._lt)
          )
        : rows;
      const page = after.slice(0, variables.limit);
      // The applications tab stores a response for the newest row while the sync pages.
      rows = rows.slice(1);
      return { CourseEnrollment: page };
    });
    loadFormbricksSurveyResponses.mockResolvedValue(loaded(URL_A, [raw('r', 'u1')]));

    const result = await syncFormbricksResponses({ body: {} }, logger);

    expect(pages[0]).toEqual({});
    expect(pages).toHaveLength(2);
    expect(result).toMatchObject({ candidates: 1003, surveys: 1, stored: 1 });
    expect(storedIds()).toEqual([1]);
  });
});
