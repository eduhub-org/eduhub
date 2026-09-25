import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RegistrationRail } from '../RegistrationRail';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

jest.mock('../../../../hooks/authentication', () => ({
  useIsAdmin: () => false,
  useIsInstructor: () => false,
}));

jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: () => ({ data: null }),
}));

// The rail composes these; what it owns is the surface and the whole-course
// actions, so the parts it merely hosts are stubbed out.
jest.mock('../Registration', () => ({
  Registration: () => <div data-testid="registration" />,
}));
jest.mock('../CourseFacts', () => ({
  CourseFacts: () => <div data-testid="facts" />,
}));

const session = {
  __typename: 'Session',
  id: 1,
  courseId: 1,
  title: 'Ankommen',
  description: '',
  isMandatory: true,
  startDateTime: '2026-09-11T17:00:00Z',
  endDateTime: '2026-09-11T19:00:00Z',
  SessionSpeakers: [],
  SessionAddresses: [],
};

const courseWith = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 9001,
    title: 'Test Event Course',
    Sessions: [session],
    CourseLocations: [],
    CourseInstructors: [],
    ...overrides,
  } as any);

describe('RegistrationRail', () => {
  it('gathers the facts, the registration and the whole-course actions', () => {
    render(<RegistrationRail course={courseWith()} isLoggedInParticipant={false} />);

    expect(screen.getByTestId('facts')).toBeInTheDocument();
    expect(screen.getByTestId('registration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sessions.add_to_calendar_short/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /general.share/ })).toBeInTheDocument();
  });

  it('omits the calendar export when there is nothing to export', () => {
    render(<RegistrationRail course={courseWith({ Sessions: [] })} isLoggedInParticipant={false} />);

    expect(
      screen.queryByRole('button', { name: /sessions.add_to_calendar_short/ })
    ).not.toBeInTheDocument();
    // sharing a course with no dates yet is still useful
    expect(screen.getByRole('button', { name: /general.share/ })).toBeInTheDocument();
  });

  it('omits the calendar export without a course title, since every entry is named after it', () => {
    render(<RegistrationRail course={courseWith({ title: null })} isLoggedInParticipant={false} />);

    expect(
      screen.queryByRole('button', { name: /sessions.add_to_calendar_short/ })
    ).not.toBeInTheDocument();
  });

  it('lists the course instructors', () => {
    const course = courseWith({
      CourseInstructors: [
        {
          id: 5,
          User: { id: 'u1', firstName: 'Nina', lastName: 'Petersen', picture: null, externalProfile: null },
        },
      ],
    });
    render(<RegistrationRail course={course} isLoggedInParticipant={false} />);

    expect(screen.getByText('Nina', { exact: false })).toBeInTheDocument();
  });
});
