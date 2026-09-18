import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseParticipants } from '../CourseParticipants';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

jest.mock('../../../../helpers/filehandling', () => ({
  getPublicImageUrl: () => '/images/common/mystery.svg',
}));

const mockUseRoleQuery = jest.fn();
jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

const participant = (
  id: string,
  firstName: string,
  matrixUserHandle: string | null = null,
  extra: { picture?: string | null; externalProfile?: string | null } = {}
) => ({
  __typename: 'CourseParticipant',
  userId: id,
  User: {
    __typename: 'User',
    id,
    firstName,
    lastName: 'Test',
    picture: extra.picture ?? null,
    externalProfile: extra.externalProfile ?? null,
    matrixUserHandle,
  },
});

const withData = (rows: unknown[], count: number) =>
  mockUseRoleQuery.mockReturnValue({
    data: {
      CourseParticipant: rows,
      CourseParticipant_aggregate: { aggregate: { count } },
    },
  });

describe('CourseParticipants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME = 'matrix.example';
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = 'https://element.example';
  });

  it('lists the others and leaves the viewer out', () => {
    withData([participant('me', 'Ich'), participant('u2', 'Aisha'), participant('u3', 'Leon')], 3);

    render(<CourseParticipants courseId={1} currentUserId="me" />);

    expect(screen.getByText('Aisha Test')).toBeInTheDocument();
    expect(screen.getByText('Leon Test')).toBeInTheDocument();
    expect(screen.queryByText('Ich Test')).not.toBeInTheDocument();
  });

  it('offers an Element direct message only where a handle is known', () => {
    withData([participant('u2', 'Aisha', 'aisha.test.ab12cd'), participant('u3', 'Leon', null)], 3);

    render(<CourseParticipants courseId={1} currentUserId="me" />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://element.example/#/user/@aisha.test.ab12cd:matrix.example');
  });

  it('counts the people it could not fit, discounting the viewer', () => {
    // 50 in the course, the query returned the first 3 (one of them the viewer)
    withData([participant('me', 'Ich'), participant('u2', 'Aisha'), participant('u3', 'Leon')], 50);

    render(<CourseParticipants courseId={1} currentUserId="me" />);

    // 50 total - the viewer - the 2 shown = 47
    expect(screen.getByText(/participants.and_more:\{"count":47\}/)).toBeInTheDocument();
  });

  it('says nothing about more people when everyone is on screen', () => {
    withData([participant('me', 'Ich'), participant('u2', 'Aisha')], 2);

    render(<CourseParticipants courseId={1} currentUserId="me" />);

    expect(screen.queryByText(/participants.and_more/)).not.toBeInTheDocument();
  });

  it('renders nothing when the viewer is the only participant', () => {
    withData([participant('me', 'Ich')], 1);

    const { container } = render(<CourseParticipants courseId={1} currentUserId="me" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the query has not resolved', () => {
    mockUseRoleQuery.mockReturnValue({ data: undefined });

    const { container } = render(<CourseParticipants courseId={1} currentUserId="me" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('leads with the most complete profiles, the photo weighing most', () => {
    withData(
      [
        participant('me', 'Ich'),
        // Name only.
        participant('u2', 'Bare'),
        // Photo, but no handle or external profile: still ranks above a
        // handle alone, since the photo is what people actually recognize.
        participant('u3', 'Photo', null, { picture: '/uploads/photo.jpg' }),
        // Handle and external profile, no photo.
        participant('u4', 'HandleAndLink', 'handleandlink.test.ab12cd', {
          externalProfile: 'https://example.com/u4',
        }),
      ],
      4
    );

    render(<CourseParticipants courseId={1} currentUserId="me" />);

    const names = screen.getAllByText(/Test$/).map((el) => el.textContent);
    expect(names).toEqual(['Photo Test', 'HandleAndLink Test', 'Bare Test']);
  });
});
