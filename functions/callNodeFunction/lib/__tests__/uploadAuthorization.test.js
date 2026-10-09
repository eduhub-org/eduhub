import { jest } from '@jest/globals';

const USER = 'user-1';

const request = (input, sessionVariables = { 'x-hasura-role': 'user', 'x-hasura-user-id': USER }) => ({
  body: { session_variables: sessionVariables, input: { base64file: 'aGVsbG8=', filename: 'f.png', ...input } },
});

const project = (overrides = {}) => ({
  Project_by_pk: {
    status: 'ONGOING',
    ProjectCourses: [{ courseId: 3, Course: { CourseInstructors: [] } }],
    ProjectMentors: [],
    ProjectAuthors: [],
    ...overrides,
  },
});

describe('authorizeUpload', () => {
  let authorizeUpload;
  let requestMock;
  let isOrgAdminOfCourseMock;

  beforeAll(async () => {
    jest.unstable_mockModule('graphql-request', () => ({
      GraphQLClient: jest.fn().mockImplementation(() => ({ request: (...args) => requestMock(...args) })),
    }));
    jest.unstable_mockModule('../orgAdminScope.js', () => ({
      isOrgAdminOfCourse: (...args) => isOrgAdminOfCourseMock(...args),
    }));
    ({ authorizeUpload } = await import('../uploadAuthorization.js'));
  });

  beforeEach(() => {
    requestMock = jest.fn();
    isOrgAdminOfCourseMock = jest.fn().mockResolvedValue(false);
  });

  it('lets admins upload anything without a lookup', async () => {
    const result = await authorizeUpload(request({ programid: 1 }, { 'x-hasura-role': 'admin', 'x-hasura-user-id': USER }));

    expect(result.authorized).toBe(true);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('refuses callers without a session user', async () => {
    expect((await authorizeUpload(request({ courseid: 1 }, {}))).authorized).toBe(false);
  });

  it('refuses targets of admin-only actions and unknown inputs', async () => {
    expect((await authorizeUpload(request({ programid: 1 }))).authorized).toBe(false);
    expect((await authorizeUpload(request({ courseid: 1, projectid: 2 }))).authorized).toBe(false);
    expect(requestMock).not.toHaveBeenCalled();
  });

  describe('userid', () => {
    it('allows the own profile only', async () => {
      expect((await authorizeUpload(request({ userid: USER }))).authorized).toBe(true);
      expect((await authorizeUpload(request({ userid: 'someone-else' }))).authorized).toBe(false);
    });
  });

  describe('courseid', () => {
    it('allows instructors of the course', async () => {
      requestMock.mockResolvedValue({ CourseInstructor: [{ id: 1 }] });

      expect((await authorizeUpload(request({ courseid: 5 }))).authorized).toBe(true);
      expect(requestMock).toHaveBeenCalledWith(expect.any(String), { id: 5, userId: USER });
    });

    it('allows org admins whose grant covers the course', async () => {
      requestMock.mockResolvedValue({ CourseInstructor: [] });
      isOrgAdminOfCourseMock.mockResolvedValue(true);

      expect((await authorizeUpload(request({ courseid: 5 }))).authorized).toBe(true);
    });

    it('refuses everyone else', async () => {
      requestMock.mockResolvedValue({ CourseInstructor: [] });

      expect((await authorizeUpload(request({ courseid: 5 }))).authorized).toBe(false);
    });
  });

  describe('projectid', () => {
    it('allows mentors and instructors of a linked course', async () => {
      requestMock.mockResolvedValueOnce(project({ ProjectMentors: [{ id: 1 }] }));
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(true);

      requestMock.mockResolvedValueOnce(
        project({ ProjectCourses: [{ courseId: 3, Course: { CourseInstructors: [{ id: 1 }] } }] })
      );
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(true);
    });

    it('allows accepted authors only while the project is open', async () => {
      requestMock.mockResolvedValueOnce(project({ ProjectAuthors: [{ id: 1 }] }));
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(true);

      requestMock.mockResolvedValueOnce(project({ ProjectAuthors: [{ id: 1 }], status: 'SUBMITTED' }));
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(false);
    });

    it('allows org admins of a linked course', async () => {
      requestMock.mockResolvedValue(project());
      isOrgAdminOfCourseMock.mockResolvedValue(true);

      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(true);
      expect(isOrgAdminOfCourseMock).toHaveBeenCalledWith(expect.anything(), USER, 3);
    });

    it('refuses everyone else and missing projects', async () => {
      requestMock.mockResolvedValueOnce(project());
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(false);

      requestMock.mockResolvedValueOnce({ Project_by_pk: null });
      expect((await authorizeUpload(request({ projectid: 9 }))).authorized).toBe(false);
    });
  });

  describe('achievementRecordId', () => {
    const record = (overrides = {}) => ({
      AchievementRecord_by_pk: {
        AchievementRecordAuthors: [],
        AchievementOption: { AchievementOptionMentors: [], AchievementOptionCourses: [] },
        ...overrides,
      },
    });

    it('allows authors, mentors and course instructors', async () => {
      requestMock.mockResolvedValueOnce(record({ AchievementRecordAuthors: [{ id: 1 }] }));
      expect((await authorizeUpload(request({ achievementRecordId: 4 }))).authorized).toBe(true);

      requestMock.mockResolvedValueOnce(
        record({ AchievementOption: { AchievementOptionMentors: [{ id: 1 }], AchievementOptionCourses: [] } })
      );
      expect((await authorizeUpload(request({ achievementRecordId: 4 }))).authorized).toBe(true);

      requestMock.mockResolvedValueOnce(
        record({
          AchievementOption: {
            AchievementOptionMentors: [],
            AchievementOptionCourses: [{ Course: { CourseInstructors: [{ id: 1 }] } }],
          },
        })
      );
      expect((await authorizeUpload(request({ achievementRecordId: 4 }))).authorized).toBe(true);
    });

    it('refuses everyone else', async () => {
      requestMock.mockResolvedValueOnce(record());
      expect((await authorizeUpload(request({ achievementRecordId: 4 }))).authorized).toBe(false);
    });
  });

  describe('jobpostingid', () => {
    it('allows admins of the organization with canManageJobs only', async () => {
      requestMock.mockResolvedValueOnce({ JobPosting_by_pk: { Organization: { OrganizationAdmins: [{ id: 1 }] } } });
      expect((await authorizeUpload(request({ jobpostingid: 2 }))).authorized).toBe(true);

      requestMock.mockResolvedValueOnce({ JobPosting_by_pk: { Organization: { OrganizationAdmins: [] } } });
      expect((await authorizeUpload(request({ jobpostingid: 2 }))).authorized).toBe(false);
    });
  });
});
