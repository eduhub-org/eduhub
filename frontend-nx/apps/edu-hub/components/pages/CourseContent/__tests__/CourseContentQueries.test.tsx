import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const session = { loggedIn: true, userId: 'user-1' as string | undefined };
jest.mock('../../../../hooks/authentication', () => ({ useIsLoggedIn: () => session.loggedIn }));
jest.mock('../../../../hooks/user', () => ({ useUserId: () => session.userId }));
jest.mock('../../../../hooks/course', () => ({ useIsCourseWithEnrollment: () => false }));
jest.mock('../../../../contexts/ParticipantPreviewContext', () => ({ useDeclareParticipantPreview: jest.fn() }));
jest.mock('../../../../helpers/imageHandling', () => ({ getBackgroundImage: async () => '' }));

const useRoleQuery = jest.fn<unknown, unknown[]>(() => ({ loading: true, called: true, data: undefined, refetch: jest.fn() }));
jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => useRoleQuery(...args),
}));

// Only rendered once a course has loaded; keep their imports out of the test.
jest.mock('../Onboarding', () => ({ __esModule: true, default: () => null }));
jest.mock('../DescriptionFields', () => ({}));
jest.mock('../FundingOrganizations', () => ({}));
jest.mock('../../../common/TileSlider/CourseProjectsSection', () => ({ __esModule: true, default: () => null }));
jest.mock('../RegistrationRail', () => ({}));
jest.mock('../LearningGoals', () => ({}));
jest.mock('../Sessions', () => ({}));
jest.mock('../CourseParticipants', () => ({}));
jest.mock('../DegreeCourses', () => ({}));
jest.mock('../../../common/PricingSummary', () => ({ __esModule: true, default: () => null }));
jest.mock('../Attendances', () => ({}));
jest.mock('../../../common/CertificateDownload', () => ({}));
jest.mock('../Projects', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../common/dialogs/NotificationSnackbar', () => ({ __esModule: true, default: () => null }));

import CourseContent from '../index';
import { COURSE_WITH_ENROLLMENT } from '../../../../queries/courseWithEnrollment';
import { COURSE_ANONYMOUS } from '../../../../queries/course';

const skipOf = (query: unknown) =>
  (useRoleQuery.mock.calls.find((call) => call[0] === query)?.[1] as { skip?: boolean } | undefined)?.skip;

describe('CourseContent queries', () => {
  beforeEach(() => {
    useRoleQuery.mockClear();
    Object.assign(session, { loggedIn: true, userId: 'user-1' });
  });

  it('asks for the enrollment of a signed-in user', () => {
    render(<CourseContent id={7} />);
    expect(skipOf(COURSE_WITH_ENROLLMENT)).toBe(false);
    expect(skipOf(COURSE_ANONYMOUS)).toBe(true);
  });

  // A session that expires or drops during a token refresh leaves no user id; the enrollment query
  // must not go out then, since it would be sent anonymous and without its required userId.
  it('does not ask for the enrollment without a user id', () => {
    session.userId = undefined;
    render(<CourseContent id={7} />);
    expect(skipOf(COURSE_WITH_ENROLLMENT)).toBe(true);
  });

  it('asks for the public course when signed out', () => {
    Object.assign(session, { loggedIn: false, userId: undefined });
    render(<CourseContent id={7} />);
    expect(skipOf(COURSE_WITH_ENROLLMENT)).toBe(true);
    expect(skipOf(COURSE_ANONYMOUS)).toBe(false);
  });
});
