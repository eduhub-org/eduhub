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
  // Instructors land in course management, where they confirm the project;
  // a mentor who doesn't instruct the course gets the project page.
  expect(calls[0].variableReplacer('[Project:Link] [Project:CourseTitle]')).toBe(
    'https://test.example.com/manage/course/42#projects Future of Food'
  );
  expect(calls[2].variableReplacer('[Project:Link]')).toBe('https://test.example.com/project/5');
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

it('links instructors to course management, mentors and the team to the project page on submission', async () => {
  await sendProjectEmail(projectEvent({ ...base, status: 'ONGOING' }, { ...base, status: 'SUBMITTED' }), logger);

  const links = Object.fromEntries(
    queueEmail.mock.calls.map(([args]) => [args.recipientEmail, args.variableReplacer('[Project:Link]')])
  );
  expect(queueEmail.mock.calls[0][0].templateType).toBe('PROJECT_SUBMITTED');
  expect(links).toEqual({
    'ivo@example.com': 'https://test.example.com/manage/course/42#projects',
    'ida@example.com': 'https://test.example.com/manage/course/42#projects',
    // A mentor who doesn't instruct the course can't open course management.
    'mia@example.com': 'https://test.example.com/project/5',
    'ann@example.com': 'https://test.example.com/project/5',
  });
});

it('links the team to the course page when it has to act there', async () => {
  await sendProjectEmail(projectEvent({ ...base, status: 'SUBMITTED' }, { ...base, status: 'ONGOING' }), logger);

  const [args] = queueEmail.mock.calls[0];
  expect(args.templateType).toBe('PROJECT_SENT_BACK');
  expect(args.variableReplacer('[Project:Link]')).toBe('https://test.example.com/course/42#projects');
});

it('links the team to the project page once the project is approved', async () => {
  await sendProjectEmail(projectEvent({ ...base, status: 'SUBMITTED' }, { ...base, status: 'COMPLETED' }), logger);

  const [args] = queueEmail.mock.calls[0];
  expect(args.templateType).toBe('PROJECT_APPROVED');
  expect(args.variableReplacer('[Project:Link]')).toBe('https://test.example.com/project/5');
});
