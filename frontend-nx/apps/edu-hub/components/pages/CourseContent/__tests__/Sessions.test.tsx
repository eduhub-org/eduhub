import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sessions } from '../Sessions';
import type { Course_Course_by_pk_Sessions, Course_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/Course';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

// Mock the hooks and dependencies
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

jest.mock('../../../../helpers/dateTimeHelpers', () => ({
  useDisplayDate: () => (date: string) => new Date(date).toLocaleDateString(),
  useFormatTimeString: () => (date: string) => new Date(date).toLocaleTimeString(),
}));

jest.mock('../../../../hooks/authentication', () => ({
  useIsAdmin: () => false,
  useIsInstructor: () => false,
}));

jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: () => ({ data: null }),
}));

jest.mock('../../../../helpers/util', () => ({
  isLinkFormat: () => false,
}));

// Mock data for testing - partial types sufficient for separator logic
const mockSessions: Course_Course_by_pk_Sessions[] = [
  {
    __typename: 'Session',
    id: 1,
    courseId: 1,
    description: '',
    startDateTime: '2024-01-15T10:00:00Z',
    endDateTime: '2024-01-15T12:00:00Z',
    title: 'Test Session',
    SessionSpeakers: [],
    SessionAddresses: [
      {
        __typename: 'SessionAddress',
        id: 1,
        address: 'Test Address 1',
        locationAddressId: null,
        CourseLocation: {
          __typename: 'CourseLocation',
          id: 1,
          locationOption: LocationOption_enum.KIEL,
          defaultSessionAddress: 'Default Address 1',
          defaultSessionAddressId: null,
        },
      },
      {
        __typename: 'SessionAddress',
        id: 2,
        address: 'Test Address 2',
        locationAddressId: null,
        CourseLocation: {
          __typename: 'CourseLocation',
          id: 2,
          locationOption: LocationOption_enum.KIEL,
          defaultSessionAddress: 'Default Address 2',
          defaultSessionAddressId: null,
        },
      },
    ],
  },
];

const mockCourseLocations: Course_Course_by_pk_CourseLocations[] = [
  {
    __typename: 'CourseLocation',
    id: 1,
    locationOption: LocationOption_enum.KIEL,
    defaultSessionAddress: 'Default Address 1',
  },
  {
    __typename: 'CourseLocation',
    id: 2,
    locationOption: LocationOption_enum.KIEL,
    defaultSessionAddress: 'Default Address 2',
  },
  {
    __typename: 'CourseLocation',
    id: 3,
    locationOption: LocationOption_enum.KIEL,
    defaultSessionAddress: 'Default Address 3',
  },
];

describe('Sessions Component - Separator Logic', () => {
  it('should render separators correctly when some courseLocations have no SessionAddresses', () => {
    render(
      <Sessions
        sessions={mockSessions}
        courseLocations={mockCourseLocations}
        isLoggedInParticipant={true}
      />
    );

    // Check that the session title is rendered
    expect(screen.getByText('Test Session')).toBeInTheDocument();

    // Check that addresses are rendered
    expect(screen.getByText('Test Address 1')).toBeInTheDocument();
    expect(screen.getByText('Test Address 2')).toBeInTheDocument();

    // Check that separators are present between addresses
    const listItem = screen.getByText('Test Session').closest('li');
    expect(listItem?.textContent).toMatch(/Test Address 1.*\+.*Test Address 2/);
  });

  it('should not render separators when there is only one address', () => {
    const singleAddressSession = [
      {
        ...mockSessions[0],
        SessionAddresses: [mockSessions[0].SessionAddresses[0]],
      },
    ];

    render(
      <Sessions
        sessions={singleAddressSession}
        courseLocations={mockCourseLocations}
        isLoggedInParticipant={true}
      />
    );

    // Check that the address is rendered
    expect(screen.getByText('Test Address 1')).toBeInTheDocument();

    // Check that no separator is present
    expect(screen.queryByText(' +\u00A0')).not.toBeInTheDocument();
  });

  it('should render session description when provided', () => {
    const sessionWithDescription = [
      {
        ...mockSessions[0],
        description: 'Bring **materials**.',
      },
    ];

    render(
      <Sessions
        sessions={sessionWithDescription}
        courseLocations={mockCourseLocations}
        isLoggedInParticipant={true}
      />
    );

    expect(screen.getByText('materials').tagName).toBe('STRONG');
  });

  it('should not render description block when description is empty', () => {
    render(
      <Sessions
        sessions={mockSessions}
        courseLocations={mockCourseLocations}
        isLoggedInParticipant={true}
      />
    );

    expect(screen.queryByText('sessions.description_show_more')).not.toBeInTheDocument();
  });

  it('should handle empty SessionAddresses gracefully', () => {
    const emptyAddressSession = [
      {
        ...mockSessions[0],
        SessionAddresses: [],
      },
    ];

    render(
      <Sessions
        sessions={emptyAddressSession}
        courseLocations={mockCourseLocations}
        isLoggedInParticipant={true}
      />
    );

    // Check that the session title is still rendered
    expect(screen.getByText('Test Session')).toBeInTheDocument();

    // Check that no addresses are rendered
    expect(screen.queryByText('Test Address 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Address 2')).not.toBeInTheDocument();
  });
});
