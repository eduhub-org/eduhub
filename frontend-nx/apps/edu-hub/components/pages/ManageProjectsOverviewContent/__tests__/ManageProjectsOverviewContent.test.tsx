import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ColumnDef } from '@tanstack/react-table';

import ManageProjectsOverviewContent from '..';
import { AuthRoles } from '../../../../types/enums';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';

const tableGridProps = jest.fn();
const managementRoles = jest.fn();
const mockUseAdminQuery = jest.fn();
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

jest.mock('../../../../hooks/authedQuery', () => ({
  useAdminQuery: (...args: unknown[]) => mockUseAdminQuery(...args),
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

jest.mock('../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [jest.fn(), { loading: false }],
}));

jest.mock('../../../../hooks/user', () => ({
  useUserId: () => 'admin-1',
}));

jest.mock('../../../../hooks/authentication', () => ({
  ...jest.requireActual('../../../../hooks/authentication'),
  useIsAdmin: () => true,
}));

jest.mock('../../../../hooks/managementRole', () => ({
  ManagementRoleProvider: ({ children, role }: { children: React.ReactNode; role?: string }) => {
    managementRoles(role);
    return <>{children}</>;
  },
  useManagementRoleContext: () => undefined,
}));

// Render what a user would see of the table: the headers, every cell of every row, and the
// first row expanded (where the Project Page link lives).
jest.mock('../../../common/TableGrid', () => ({
  __esModule: true,
  default: (props: {
    data: { id: number }[];
    columns: ColumnDef<{ id: number }>[];
    expandableRowComponent?: (p: { row: unknown }) => React.ReactElement | null;
  }) => {
    tableGridProps(props);
    const render = (value: unknown, context: unknown) =>
      typeof value === 'function' ? value(context) : (value as React.ReactNode);
    return (
      <div>
        <div role="row">
          {props.columns.map((column) => (
            <span role="columnheader" key={column.id}>
              {render(column.header, {})}
            </span>
          ))}
        </div>
        {props.data.map((row) => (
          <div role="row" key={row.id} data-testid={`row-${row.id}`}>
            {props.columns.map((column) => (
              <div role="cell" key={column.id}>
                {render(column.cell, { row: { original: row } })}
              </div>
            ))}
          </div>
        ))}
        {props.data[0] && props.expandableRowComponent
          ? props.expandableRowComponent({ row: props.data[0] })
          : null}
      </div>
    );
  },
}));

const lastTableProps = () => tableGridProps.mock.calls[tableGridProps.mock.calls.length - 1][0];

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
  courses: [
    {
      __typename: 'Course',
      id: 7,
      title: 'Machine Learning',
      Program: { __typename: 'Program', id: 3, title: 'Winter 2026', shortTitle: 'WS26' },
    },
    {
      __typename: 'Course',
      id: 8,
      title: 'Deep Learning',
      Program: { __typename: 'Program', id: 4, title: 'Summer 2026', shortTitle: null },
    },
  ],
};

type QueryDocument = { definitions: { kind: string; name?: { value: string } }[] };
const queryNames = (mock: jest.Mock) =>
  mock.mock.calls.map(
    ([doc]) =>
      (doc as QueryDocument).definitions.find((d) => d.kind === 'OperationDefinition')?.name?.value
  );

describe('ManageProjectsOverviewContent', () => {
  beforeEach(() => {
    tableGridProps.mockClear();
    managementRoles.mockClear();
    mockUseAdminQuery.mockReset();
    mockUseAdminQuery.mockReturnValue({
      data: { Project: [project], Project_aggregate: { aggregate: { count: 120 } } },
      loading: false,
      refetch: jest.fn(),
    });
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
    window.localStorage.clear();
  });

  it('loads the first page of 50 projects across all courses as admin', () => {
    render(<ManageProjectsOverviewContent />);

    expect(queryNames(mockUseAdminQuery)).toEqual(expect.arrayContaining(['ProjectsOverview']));
    expect(mockUseAdminQuery.mock.calls.at(-1)?.[1]).toEqual({
      variables: { limit: 50, offset: 0 },
    });
    expect(lastTableProps()).toMatchObject({
      enablePagination: true,
      pageIndex: 0,
      pageSize: 50,
      totalCount: 120,
    });
    // The grid's own queries and mutations run under the admin role as well.
    expect(managementRoles).toHaveBeenCalledWith(AuthRoles.admin);
  });

  it('asks the server for the next page when paging', () => {
    render(<ManageProjectsOverviewContent />);

    act(() => lastTableProps().onPageChange(1));

    expect(mockUseAdminQuery.mock.calls.at(-1)?.[1]).toEqual({
      variables: { limit: 50, offset: 50 },
    });
    expect(lastTableProps().pageIndex).toBe(1);
  });

  it('shows each project with its courses and programs', () => {
    render(<ManageProjectsOverviewContent />);

    expect(screen.getByRole('columnheader', { name: 'courses_column' })).toBeInTheDocument();
    const row = within(screen.getByTestId('row-42'));
    expect(row.getByText('Solar Boat')).toBeInTheDocument();
    expect(row.getByText('Machine Learning')).toBeInTheDocument();
    expect(row.getByText(/WS26/)).toBeInTheDocument();
    // Without a short title the program's full title is shown.
    expect(row.getByText(/Summer 2026/)).toBeInTheDocument();
  });

  it('links to the Project Page and offers no course-only actions', () => {
    render(<ManageProjectsOverviewContent />);

    expect(screen.getByRole('link', { name: /open_project_page/i })).toHaveAttribute(
      'href',
      '/project/42'
    );
    expect(lastTableProps().onAddButtonClick).toBeUndefined();
    expect(lastTableProps().onRowDelete).toBeUndefined();
    expect(queryNames(mockUseRoleQuery)).not.toContain('ProjectsByCourse');
  });

  it('links Admins to the project settings that stay in Settings', () => {
    render(<ManageProjectsOverviewContent />);

    expect(screen.getByRole('link', { name: /settings_links.project_types/ })).toHaveAttribute(
      'href',
      '/manage/settings/project-types'
    );
  });
});
