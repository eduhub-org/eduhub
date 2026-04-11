import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();
const mockValidateAndExtract = jest.fn();

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('graphql-request', () => {
  const actual = jest.requireActual('graphql-request');
  return {
    ...actual,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: mockGraphqlRequest,
    })),
  };
});

jest.unstable_mockModule('../../lib/formbricks.js', () => ({
  validateAndExtractFormbricksSurvey: mockValidateAndExtract,
}));

const { default: saveCourseFormbricksEnrollmentSurvey } = await import('../index.js');

describe('saveCourseFormbricksEnrollmentSurvey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
    process.env.FORMBRICKS_API_KEY = 'fbk_test';
    process.env.FORMBRICKS_API_URL = 'https://formbricks.example.com';
    mockValidateAndExtract.mockReturnValue({
      baseUrl: 'https://formbricks.example.com',
      surveyId: 'survey_123',
    });
  });

  it('rejects invalid course id', async () => {
    const req = { body: { input: { itemId: 'abc', text: 'https://formbricks.example.com/s/survey_123' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('MISSING_COURSE_ID');
  });

  it('clears survey url when text is empty', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      update_Course_by_pk: { id: 42, formbricksEnrollmentSurveyUrl: null },
    });

    const req = { body: { input: { itemId: 42, text: '   ' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(true);
    expect(result.formbricksEnrollmentSurveyUrl).toBeNull();
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    const variables = mockGraphqlRequest.mock.calls[0][1];
    expect(variables).toEqual({ courseId: 42, surveyUrl: null });
  });

  it('rejects non-formbricks link when parser fails', async () => {
    mockValidateAndExtract.mockReturnValueOnce(null);

    const req = { body: { input: { itemId: 42, text: 'https://example.com/forms/abc' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('INVALID_SURVEY_URL');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('rejects survey when token lacks access', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue('forbidden'),
    });

    const req = { body: { input: { itemId: 42, text: 'https://formbricks.example.com/s/survey_123' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('FORMBRICKS_AUTH_ERROR');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('rejects survey when mandatory hidden fields are missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: {
          id: 'survey_123',
          hiddenFields: {
            enabled: true,
            fieldIds: ['eduhubEnrollmentId'],
          },
        },
      }),
    });

    const req = { body: { input: { itemId: 42, text: 'https://formbricks.example.com/s/survey_123' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('FORMBRICKS_REQUIRED_HIDDEN_FIELDS_MISSING');
    expect(result.error).toContain('eduhubUserId');
    expect(result.error).toContain('eduhubCourseId');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('accepts survey when mandatory hidden fields are configured', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: {
          id: 'survey_123',
          hiddenFields: {
            enabled: true,
            fieldIds: ['eduhubUserId', 'eduhubCourseId', 'eduhubEnrollmentId'],
          },
        },
      }),
    });
    mockGraphqlRequest.mockResolvedValueOnce({
      update_Course_by_pk: { id: 42, formbricksEnrollmentSurveyUrl: 'https://formbricks.example.com/s/survey_123' },
    });

    const req = { body: { input: { itemId: 42, text: 'https://formbricks.example.com/s/survey_123' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(true);
    expect(result.formbricksEnrollmentSurveyUrl).toBe('https://formbricks.example.com/s/survey_123');
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('saves canonical survey url after successful access validation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: {
          id: 'survey_123',
          hiddenFields: {
            enabled: true,
            fieldIds: ['eduhubUserId', 'eduhubCourseId'],
          },
        },
      }),
    });
    mockGraphqlRequest.mockResolvedValueOnce({
      update_Course_by_pk: { id: 42, formbricksEnrollmentSurveyUrl: 'https://formbricks.example.com/s/survey_123' },
    });

    const req = { body: { input: { itemId: 42, text: 'https://formbricks.example.com/s/survey_123?foo=bar' } } };
    const result = await saveCourseFormbricksEnrollmentSurvey(req, mockLogger);

    expect(result.success).toBe(true);
    expect(result.formbricksEnrollmentSurveyUrl).toBe('https://formbricks.example.com/s/survey_123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://formbricks.example.com/api/v1/management/surveys/survey_123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'fbk_test',
        }),
      })
    );

    const variables = mockGraphqlRequest.mock.calls[0][1];
    expect(variables).toEqual({
      courseId: 42,
      surveyUrl: 'https://formbricks.example.com/s/survey_123',
    });
  });
});
