import { describe, expect, it } from '@jest/globals';

import {
  buildQuestionDescriptors,
  formattedResponsesForEnrollment,
  responseMatchesEnrollment,
  toStoredQuestionnaireResponse,
} from '../formbricksResponses.js';

const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const survey = {
  id: 'srv1',
  name: 'Application',
  questions: [
    { id: 'q1', type: 'openText', headline: { default: 'Experience?' } },
    { id: 'q2', type: 'multipleChoiceMulti', headline: { default: 'Topics' } },
  ],
};

const response = (id, data, extra = {}) => ({
  id,
  createdAt: '2026-10-01T10:00:00.000Z',
  finished: true,
  data: { eduhubUserId: USER_ID, eduhubCourseId: '42', ...data },
  ...extra,
});

describe('responseMatchesEnrollment', () => {
  it('requires user and course, and the enrollment only when both sides have it', () => {
    const enrollment = { userId: USER_ID, courseId: 42, enrollmentId: 7 };
    expect(responseMatchesEnrollment(response('a', {}), enrollment)).toBe(true);
    expect(responseMatchesEnrollment(response('a', { eduhubEnrollmentId: '7' }), enrollment)).toBe(true);
    expect(responseMatchesEnrollment(response('a', { eduhubEnrollmentId: '8' }), enrollment)).toBe(false);
    expect(responseMatchesEnrollment(response('a', { eduhubCourseId: '43' }), enrollment)).toBe(false);
    expect(responseMatchesEnrollment(response('a', { eduhubUserId: 'other' }), enrollment)).toBe(false);
  });
});

describe('formattedResponsesForEnrollment', () => {
  const loaded = {
    survey: { id: 'srv1', name: 'Application' },
    surveyUrl: 'https://forms.example/s/srv1',
    questionDescriptors: buildQuestionDescriptors(survey),
    responses: [
      response('old', { q1: 'little' }, { createdAt: '2026-09-01T10:00:00.000Z' }),
      response('new', { q2: ['ML', 'Stats'], q1: 'a lot', extra: 'x' }),
      response('foreign', { q1: 'x', eduhubCourseId: '99' }),
    ],
  };

  it('returns matching responses newest first, answers in survey order with their question type', () => {
    const result = formattedResponsesForEnrollment(loaded, { userId: USER_ID, courseId: 42 });
    expect(result.map((r) => r.id)).toEqual(['new', 'old']);
    expect(result[0].answers).toEqual([
      { questionId: 'q1', questionType: 'openText', headline: 'Experience?', answer: 'a lot', rawAnswer: 'a lot' },
      expect.objectContaining({ questionId: 'q2', questionType: 'multipleChoiceMulti', headline: 'Topics' }),
      { questionId: 'extra', questionType: 'unknown', headline: 'extra', answer: 'x', rawAnswer: 'x' },
    ]);
  });

  it('builds the stored JSON with the provider first', () => {
    const [newest] = formattedResponsesForEnrollment(loaded, { userId: USER_ID, courseId: 42 });
    const stored = toStoredQuestionnaireResponse(loaded, newest, new Date('2026-10-07T00:00:00.000Z'));
    expect(Object.keys(stored)[0]).toBe('provider');
    expect(stored).toEqual({
      provider: 'formbricks',
      formatVersion: 1,
      fetchedAt: '2026-10-07T00:00:00.000Z',
      survey: { id: 'srv1', name: 'Application', url: 'https://forms.example/s/srv1' },
      response: newest,
    });
  });
});
