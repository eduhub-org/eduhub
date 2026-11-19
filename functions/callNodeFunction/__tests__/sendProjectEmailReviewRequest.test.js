import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

const request = jest.fn();
const queueEmail = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  gql: (strings) => strings.join(''),
  GraphQLClient: jest.fn(() => ({ request })),
}));
jest.unstable_mockModule('../lib/queueEmail.js', () => ({ queueEmail }));
const { default: sendProjectEmail } = await import('../sendProjectEmail/index.js');

const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
const user = (id) => ({ id, email: `${id}@example.com`, firstName: id, lastName: 'X' });

const projectEvent = (oldRow, newRow) => ({
  body: { table: { name: 'Project' }, event: { op: 'UPDATE', data: { old: oldRow, new: newRow } } },
});

beforeEach(() => {
  process.env.FRONTEND_URL = 'https://test.example.com';
  queueEmail.mockResolvedValue({ success: true });
  request.mockResolvedValue({
    Project_by_pk: {
      id: 5,
      title: 'Solar',
      ProjectAuthors: [{ participationStatus: 'ACCEPTED', User: user('ann') }],
      ProjectMentors: [{ User: user('mia') }],
      ProjectCourses: [
        {
          Course: {
            id: 42,
            title: 'Future of Food',
            CourseInstructors: [{ User: user('ivo') }, { User: user('ida') }],
            Program: {},
          },
        },
      ],
    },
  });
});

afterEach(() => jest.clearAllMocks());

const base = { id: 5, status: 'PROPOSED', projectReviewRequestedAt: null };

it('emails instructors and mentors once a team requests approval of its proposal', async () => {
  const result = await sendProjectEmail(
    projectEvent(base, { ...base, projectReviewRequestedAt: '2026-11-19T10:00:00Z' }),
    logger
  );

  expect(result).toMatchObject({ success: true, templateType: 'PROJECT_REVIEW_REQUESTED', queued: 3 });
  const calls = queueEmail.mock.calls.map(([args]) => args);
  expect(calls.map((c) => c.recipientEmail)).toEqual([
    'ivo@example.com',
    'ida@example.com',
    'mia@example.com',
  ]);
  expect(calls.every((c) => c.templateType === 'PROJECT_REVIEW_REQUESTED' && c.courseId === 42)).toBe(true);
  // The template's bcc (the EduHub team) goes along with the first mail only.
  expect(calls.map((c) => c.includeTemplateCopies)).toEqual([true, false, false]);
  // Staff land in course management, where they confirm the project.
  expect(calls[0].variableReplacer('[Project:Link] [Project:CourseTitle]')).toBe(
    'https://test.example.com/manage/course/42#projects Future of Food'
  );
});

it('does not email again when an already requested approval is touched', async () => {
  const requested = { ...base, projectReviewRequestedAt: '2026-11-19T10:00:00Z' };
  const result = await sendProjectEmail(
    projectEvent(requested, { ...requested, projectReviewRequestedAt: '2026-11-20T10:00:00Z' }),
    logger
  );

  expect(result.messageKey).toBe('NO_ACTION_NEEDED');
  expect(queueEmail).not.toHaveBeenCalled();
});

it('keeps linking participants to the course page', async () => {
  await sendProjectEmail(projectEvent({ ...base, status: 'ONGOING' }, { ...base, status: 'SUBMITTED' }), logger);

  const [first] = queueEmail.mock.calls[0];
  expect(first.templateType).toBe('PROJECT_SUBMITTED');
  expect(first.variableReplacer('[Project:Link]')).toBe('https://test.example.com/course/42#projects');
});
