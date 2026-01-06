import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sessions } from '../Sessions';

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

// Mock data for testing
const mockSessions = [
  {
    startDateTime: '2024-01-15T10:00:00Z',
    endDateTime: '2024-01-15T12:00:00Z',
    title: 'Test Session',
    SessionSpeakers: [],
    SessionAddresses: [
      {
        id: 1,
        address: 'Test Address 1',
        CourseLocation: {
          id: 1,
          locationOption: 'OFFLINE',
          defaultSessionAddress: 'Default Address 1',
        },
      },
      {
        id: 2,
        address: 'Test Address 2',
        CourseLocation: {
          id: 2,
          locationOption: 'OFFLINE',
          defaultSessionAddress: 'Default Address 2',
        },
      },
    ],
  },
];

const mockCourseLocations = [
  {
    id: 1,
    locationOption: 'OFFLINE',
    defaultSessionAddress: 'Default Address 1',
  },
  {
    id: 2,
    locationOption: 'OFFLINE',
    defaultSessionAddress: 'Default Address 2',
  },
  {
    id: 3,
    locationOption: 'OFFLINE',
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
    // The separator should be " + " between the two addresses (with non-breaking space)
    const separator = screen.getByText(' +\u00A0');
    expect(separator).toBeInTheDocument();
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
