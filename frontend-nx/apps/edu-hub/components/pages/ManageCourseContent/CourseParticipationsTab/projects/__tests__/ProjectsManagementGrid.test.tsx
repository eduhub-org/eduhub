import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProjectsManagementGrid from '../ProjectsManagementGrid';
import { ProjectRow } from '../../../../CourseContent/Projects/types';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../../../__generated__/globalTypes';

const tableGridProps = jest.fn();
const mockUseRoleQuery = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'authenticated' }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), locale: 'en', query: {} }),
}));

jest.mock('../../../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

jest.mock('../../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [jest.fn(), { loading: false }],
}));

jest.mock('../../../../../../hooks/user', () => ({
  useUserId: () => 'instructor-1',
}));

// Capture what the grid hands to the table and show the first row expanded,
// so the test sees the row actions and the project link a user would see.
jest.mock('../../../../../common/TableGrid', () => ({
  __esModule: true,
  default: (props: {
    data: unknown[];
    expandableRowComponent?: (p: { row: unknown }) => React.ReactElement | null;
  }) => {
    tableGridProps(props);
    const first = props.data[0];
    return first && props.expandableRowComponent ? (
      <div>{props.expandableRowComponent({ row: first })}</div>
    ) : null;
  },
}));

const lastTableProps = () =>
  tableGridProps.mock.calls[tableGridProps.mock.calls.length - 1][0];

const project = {
  __typename: 'Project',
  id: 42,
  title: 'Solar Boat',
  tagline: null,
  description: null,
  coverImageUrl: null,
  documentationUrl: null,
  presentationUrl: null,
  externalUrl: null,
  documentationInstructionId: null,
  status: ProjectStatus_enum.ONGOING,
  published: false,
  type: null,
  rating: null,
  ratingComment: null,
  suggestedForPublication: false,
  acceptingParticipants: false,
  organizationId: null,
  proposedByUserId: null,
  parentProjectId: null,
  submittedAt: null,
  submittedBy: null,
  sentBackAt: null,
  projectReviewRequestedAt: null,
  submissionDeadline: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  Organization: null,
  ProjectType: null,
  ProjectDocumentationInstruction: null,
  SubmittedByUser: null,
  ProjectAuthors: [
    {
      __typename: 'ProjectAuthor',
      id: 1,
      userId: 'author-1',
      participationStatus: ProjectParticipationStatus_enum.ACCEPTED,
      User: { __typename: 'User', id: 'author-1', firstName: 'Ada', lastName: 'Lovelace' },
    },
  ],
  ProjectMentors: [],
  ProjectConsentEvents: [],
} as unknown as ProjectRow;

const renderGrid = (courseId?: number) =>
  render(
    <ProjectsManagementGrid
      courseId={courseId}
      projects={[project]}
      loading={false}
      refetchQueries={['SomeProjectList']}
      onRefetch={jest.fn()}
      programDefaultProjectType={null}
      courseDefaultProjectSubmissionDeadline={null}
      courseSubmissionDeadlineDefaultSource={null}
    />
  );

const ranQueryNames = () =>
  mockUseRoleQuery.mock.calls
    .filter(([, options]) => !(options as { skip?: boolean } | undefined)?.skip)
    .map(([doc]) => (doc as { definitions: { name?: { value: string } }[] }).definitions[0].name?.value);

describe('ProjectsManagementGrid', () => {
  beforeEach(() => {
    tableGridProps.mockClear();
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
  });

  it('shows the projects it is given and does not load them itself', () => {
    renderGrid(7);

    expect(lastTableProps().data).toEqual([project]);
    expect(ranQueryNames()).not.toContain('ProjectsByCourse');
  });

  it('offers adding to and removing from the course, with course-scoped links', () => {
    renderGrid(7);

    expect(lastTableProps().onAddButtonClick).toEqual(expect.any(Function));
    expect(lastTableProps().onRowDelete).toEqual(expect.any(Function));
    expect(screen.getByRole('link', { name: /open_project_page/i })).toHaveAttribute(
      'href',
      '/course/7/project/42'
    );
  });

  it('without a course, hides the course-only actions and links to the plain Project Page', () => {
    renderGrid();

    expect(lastTableProps().onAddButtonClick).toBeUndefined();
    expect(lastTableProps().onRowDelete).toBeUndefined();
    expect(screen.getByRole('link', { name: /open_project_page/i })).toHaveAttribute(
      'href',
      '/project/42'
    );
    expect(ranQueryNames()).not.toContain('ProjectCoursesByCourse');
  });

  it('offers the project preview among the row actions', () => {
    renderGrid();

    const actionColumn = lastTableProps().columns.find((c: { id: string }) => c.id === 'action');
    render(<>{actionColumn.cell({ row: { original: project } })}</>);

    expect(screen.getByRole('button', { name: 'projects.actions.preview' })).toBeInTheDocument();
  });

  describe('when the team withdrew its publication consent', () => {
    const renderTitleCell = (row: ProjectRow) => {
      renderGrid();
      const titleColumn = lastTableProps().columns.find((c: { id: string }) => c.id === 'title');
      return render(<>{titleColumn.cell({ row: { original: row } })}</>);
    };
    const withdrawn = {
      ...project,
      status: ProjectStatus_enum.COMPLETED,
      published: false,
      ProjectConsentEvents: [
        {
          __typename: 'ProjectConsentEvent',
          id: 3,
          eventType: 'withdrawn',
          created_at: '2026-11-20T10:00:00Z',
        },
      ],
    } as unknown as ProjectRow;

    it('warns that the team withdrew its consent', () => {
      const { getByText } = renderTitleCell(withdrawn);

      expect(getByText('projects.table.consent_withdrawn')).toBeInTheDocument();
    });

    it('shows no warning when the latest consent event is a grant', () => {
      const { queryByText } = renderTitleCell({
        ...withdrawn,
        ProjectConsentEvents: [
          { __typename: 'ProjectConsentEvent', id: 4, eventType: 'granted', created_at: '2026-11-21T10:00:00Z' },
        ],
      } as unknown as ProjectRow);

      expect(queryByText('projects.table.consent_withdrawn')).not.toBeInTheDocument();
    });

    it('shows no warning when the team never decided', () => {
      const { queryByText } = renderTitleCell({ ...withdrawn, ProjectConsentEvents: [] } as unknown as ProjectRow);

      expect(queryByText('projects.table.consent_withdrawn')).not.toBeInTheDocument();
    });
  });
});
