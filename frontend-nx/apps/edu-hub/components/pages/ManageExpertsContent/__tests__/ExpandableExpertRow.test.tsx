import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ExpertsList_User } from '../../../../queries/__generated__/ExpertsList';
import { ExpandableExpertRow } from '../ExpandableExpertRow';
import { expertRoles } from '../expertDirectory';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
  useFormatter: () => ({ dateTime: () => 'date' }),
}));

jest.mock('../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [jest.fn(), { loading: false }],
}));

const course = (id: number, title: string, description: string | null = null) => ({
  __typename: 'CourseInstructor' as const,
  id,
  Course: {
    __typename: 'Course' as const,
    id: id * 10,
    title,
    tagline: null,
    contentDescriptionField1: description,
    contentDescriptionField2: null,
    headingDescriptionField1: null,
    headingDescriptionField2: null,
    Program: {
      __typename: 'Program' as const,
      id: 1,
      shortTitle: 'WS24',
      type: 'COURSES',
      lectureStart: `2024-10-${String(id).padStart(2, '0')}`,
      organizationId: 1,
    },
  },
});

const expert = {
  __typename: 'User',
  id: 'u1',
  firstName: 'Ivonne',
  lastName: 'Schembera',
  email: 'ivonne@example.com',
  picture: null,
  externalProfile: null,
  organizationName: null,
  Organization: null,
  matrixUserHandle: null,
  doNotContact: false,
  CourseInstructors: [
    course(1, 'Lean Startup'),
    course(2, 'Startup Finanzierung', 'Wie finanziere ich ein Startup? Wir sprechen über Data Science für Investoren.'),
    course(3, 'MVP'),
  ],
  SessionSpeakers: [],
  ProjectMentors: [],
  AchievementOptionMentors: [],
  ExpertNotes: [],
} as unknown as ExpertsList_User;

const renderRow = (search: string) =>
  render(
    <ExpandableExpertRow
      expert={expert}
      roles={expertRoles(expert)}
      search={search}
      currentUserId="me"
      isAdmin
      noteOrganizations={[]}
      onChanged={jest.fn()}
      onError={jest.fn()}
    />
  );

describe('ExpandableExpertRow', () => {
  it('lists the hits first, then the notes, and keeps other involvements collapsed', () => {
    renderRow('data science');

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings[0]).toContain('matches_headline');
    expect(headings[1]).toBe('notes');
    expect(headings[2]).toBe('involvements_other');

    // The hit is shown with its excerpt and the words marked.
    expect(screen.getByText('Startup Finanzierung')).toBeInTheDocument();
    expect(screen.getByText('Data', { selector: 'mark' })).toBeInTheDocument();
    expect(screen.getByText('Science', { selector: 'mark' })).toBeInTheDocument();
    expect(screen.queryByText('Lean Startup')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/involvements_show/));
    expect(screen.getByText('Lean Startup')).toBeInTheDocument();
    expect(screen.getByText('MVP')).toBeInTheDocument();
  });

  it('shows the newest involvements without a search', () => {
    renderRow('');

    expect(screen.queryByText(/matches_headline/)).not.toBeInTheDocument();
    expect(screen.getByText('involvements')).toBeInTheDocument();
    expect(screen.getByText('Lean Startup')).toBeInTheDocument();
  });
});
