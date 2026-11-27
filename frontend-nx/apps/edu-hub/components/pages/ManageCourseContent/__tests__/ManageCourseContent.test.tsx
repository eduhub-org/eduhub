import { render } from '@testing-library/react';

const replace = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ replace }) }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const roles = { admin: false, instructor: false, orgAdmin: false };
jest.mock('../../../../hooks/authentication', () => ({
  useIsAdmin: () => roles.admin,
  useIsInstructor: () => roles.instructor,
  useIsOrgAdmin: () => roles.orgAdmin,
  useIsUserIdInList: () => false,
}));
const impersonation = { loading: false };
jest.mock('../../../../contexts/ImpersonationContext', () => ({ useImpersonation: () => impersonation }));
jest.mock('../../../../hooks/user', () => ({ useUserId: () => 'user-1' }));
jest.mock('../../../../hooks/manageScope', () => ({ useManageCourseWhere: () => ({}) }));

const useRoleQuery = jest.fn(() => ({ loading: true, data: undefined, error: undefined, refetch: jest.fn() }));
jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => useRoleQuery(...(args as [])),
  useOrgAdminQuery: () => ({ loading: false, data: undefined }),
}));
jest.mock('../../../../hooks/authedMutation', () => ({ useRoleMutation: () => [jest.fn(), {}] }));
// The tabs are not rendered while the course loads; keep their imports out of the test.
jest.mock('../DescriptionTab', () => ({}));
jest.mock('../SessionsTab', () => ({}));
jest.mock('../ApplicationsTab', () => ({}));
jest.mock('../CourseParticipationsTab', () => ({}));
jest.mock('../DegreeParticipationsTab', () => ({}));
jest.mock('../ParticipantPreviewButton', () => ({}));
jest.mock('../PublicEventNotice', () => ({}));
jest.mock('../RausgegangenEventSection', () => ({}));
jest.mock('../InstructorConfidentialityGate', () => ({}));
jest.mock('../../../../hooks/useCanonicalManageCoursePath', () => ({ useCanonicalManageCoursePath: jest.fn() }));

import { ManageCourseContent } from '../index';
import { MANAGED_COURSE } from '../../../../queries/course';

const managedCourseRequested = () => useRoleQuery.mock.calls.some((call: unknown[]) => call[0] === MANAGED_COURSE);

describe('ManageCourseContent', () => {
  beforeEach(() => {
    replace.mockClear();
    useRoleQuery.mockClear();
    Object.assign(roles, { admin: false, instructor: false, orgAdmin: false });
    impersonation.loading = false;
  });

  it('sends a participant to the course page without requesting ManagedCourse', () => {
    render(<ManageCourseContent courseId={42} expectedSegment="event" />);

    expect(replace).toHaveBeenCalledWith('/event/42');
    expect(managedCourseRequested()).toBe(false);
  });

  it('requests ManagedCourse for an instructor', () => {
    roles.instructor = true;
    render(<ManageCourseContent courseId={42} expectedSegment="course" />);

    expect(replace).not.toHaveBeenCalled();
    expect(managedCourseRequested()).toBe(true);
  });

  it('waits for a pending impersonation before redirecting', () => {
    impersonation.loading = true;
    render(<ManageCourseContent courseId={42} expectedSegment="course" />);

    expect(replace).not.toHaveBeenCalled();
    expect(managedCourseRequested()).toBe(false);
  });
});
