import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Every Hasura call goes through GraphQLClient.request; answer by operation name
// so each test only has to describe the rows it cares about.
const request = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({ request })),
}));

process.env.HASURA_ENDPOINT = 'http://hasura.test/v1/graphql';
process.env.HASURA_ADMIN_SECRET = 'test-secret';

const { default: manageTestEnrollment } = await import('../manageTestEnrollment/index.js');

const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const COURSE_ID = 42;
const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const call = (operation, role) =>
  manageTestEnrollment(
    {
      headers: { operation },
      body: {
        input: { courseId: COURSE_ID },
        session_variables: { 'x-hasura-role': role, 'x-hasura-user-id': USER_ID },
      },
    },
    logger
  );

const answer = ({ instructs, enrollment }) => {
  request.mockImplementation(async (document) => {
    if (document.includes('query TestEnrollmentContext')) {
      return {
        Course_by_pk: { id: COURSE_ID, CourseInstructors: instructs ? [{ id: 1 }] : [] },
        CourseEnrollment: enrollment ? [enrollment] : [],
      };
    }
    if (document.includes('query TestEnrollmentArtefacts')) {
      return { ProjectAuthor: [], Session: [] };
    }
    if (document.includes('mutation DeleteTestEnrollment')) {
      return { delete_CourseEnrollment_by_pk: { id: enrollment.id } };
    }
    if (document.includes('mutation InsertTestEnrollment')) {
      return { insert_CourseEnrollment_one: { id: 99 } };
    }
    throw new Error(`unexpected document: ${document}`);
  });
};

const deleteCalls = () => request.mock.calls.filter(([document]) => document.includes('mutation DeleteTestEnrollment'));

const preview = { id: 7, isTest: true, status: 'CONFIRMED', created_at: '2026-09-01T10:00:00Z' };
const real = { id: 8, isTest: false, status: 'CONFIRMED', created_at: '2026-09-01T10:00:00Z' };

beforeEach(() => {
  request.mockReset();
});

describe('removing a preview after losing the instructorship', () => {
  it('lets a former instructor end their own preview', async () => {
    answer({ instructs: false, enrollment: preview });
    const result = await call('remove', 'instructor');
    expect(result).toMatchObject({ success: true, messageKey: 'TEST_ENROLLMENT_REMOVED', enrollmentId: 7 });
    expect(deleteCalls()).toHaveLength(1);
  });

  it('lets someone who lost the instructor role entirely end it under `user`', async () => {
    answer({ instructs: false, enrollment: preview });
    const result = await call('remove', 'user');
    expect(result).toMatchObject({ success: true, enrollmentId: 7 });
    expect(deleteCalls()).toHaveLength(1);
  });

  it('never removes a real enrollment, whatever the role', async () => {
    for (const role of ['user', 'instructor']) {
      answer({ instructs: false, enrollment: real });
      const result = await call('remove', role);
      expect(result).toMatchObject({ success: false, messageKey: 'TEST_ENROLLMENT_UNAUTHORIZED' });
    }
    expect(deleteCalls()).toHaveLength(0);
  });
});

describe('creating a preview', () => {
  it('still requires instructing the course', async () => {
    answer({ instructs: false, enrollment: null });
    const result = await call('create', 'instructor');
    expect(result).toMatchObject({ success: false, messageKey: 'TEST_ENROLLMENT_UNAUTHORIZED' });
  });

  it('is refused to the plain `user` role even on a course with a preview', async () => {
    answer({ instructs: true, enrollment: null });
    const result = await call('create', 'user');
    expect(result).toMatchObject({ success: false, messageKey: 'TEST_ENROLLMENT_UNAUTHORIZED' });
    expect(request).not.toHaveBeenCalled();
  });

  it('works for an instructor of the course', async () => {
    answer({ instructs: true, enrollment: null });
    const result = await call('create', 'instructor');
    expect(result).toMatchObject({ success: true, messageKey: 'TEST_ENROLLMENT_CREATED', enrollmentId: 99 });
  });
});
