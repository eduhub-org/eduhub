import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ColumnDef } from '@tanstack/react-table';

import ManageProjectsOverviewContent from '..';
import ProjectsOverviewFilters from '../ProjectsOverviewFilters';
import { defaultProjectsOverviewFilters } from '../projectsOverviewWhere';
import { AuthRoles } from '../../../../types/enums';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';

const tableGridProps = jest.fn();
const managementRoles = jest.fn();
const mockUseManageQuery = jest.fn();
const mockUseAdminQuery = jest.fn();
const mockUseRoleQuery = jest.fn();
let mockIsAdmin = true;
// The role the grid's ManagementRoleProvider hands down, as the real context would.
let mockProvidedRole: string | undefined;

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
  // useManageQuery pins the caller's management role (admin or org_admin) on the request.
  useManageQuery: (...args: unknown[]) => mockUseManageQuery(...args),
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
  useIsAdmin: () => mockIsAdmin,
  useManageRole: () => (mockIsAdmin ? 'admin' : 'org_admin'),
}));

jest.mock('../../../../hooks/managementRole', () => ({
  ManagementRoleProvider: ({ children, role }: { children: React.ReactNode; role?: string }) => {
    managementRoles(role);
    mockProvidedRole = role;
    return <>{children}</>;
  },
  useManagementRoleContext: () => mockProvidedRole,
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

// A plain select stands in for the material dropdown, which only has to hand the chosen value on.
jest.mock('../../../inputs/DropDownSelector', () =>
  function MockDropDown({
    label,
    value,
    options,
    nullableLabel,
    onValueUpdated,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    nullableLabel?: string;
    onValueUpdated: (value: string) => void;
  }) {
    return (
      <select aria-label={label} value={value} onChange={(event) => onValueUpdated(event.target.value)}>
        <option value="">{nullableLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

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
const operationName = (doc: unknown) =>
  (doc as QueryDocument).definitions.find((d) => d.kind === 'OperationDefinition')?.name?.value;
const queryNames = (mock: jest.Mock) => mock.mock.calls.map(([doc]) => operationName(doc));
/** Variables of the latest call of the named overview query that is sent (not skipped). */
const lastVariables = (name: string) =>
  mockUseManageQuery.mock.calls
    .filter(([doc, options]) => operationName(doc) === name && !options?.skip)
    .at(-1)?.[1]?.variables;

const statusCount = (count: number) => ({
  __typename: 'Project_aggregate',
  aggregate: { __typename: 'Project_aggregate_fields', count },
});

const manageQueryData: Record<string, unknown> = {
  ProjectsOverview: { Project: [project], Project_aggregate: { aggregate: { count: 120 } } },
  ProjectsOverviewStatusCounts: {
    TEMPLATE: statusCount(10),
    PROPOSED: statusCount(11),
    ONGOING: statusCount(12),
    SENT_BACK: statusCount(13),
    SUBMITTED: statusCount(14),
    COMPLETED_PASSED: statusCount(15),
    SUGGESTED_FOR_PUBLICATION: statusCount(16),
    PUBLISHED: statusCount(17),
    INCOMPLETE_FAILED: statusCount(18),
  },
  Programs: {
    Program: [
      { id: 3, title: 'Winter 2026', shortTitle: 'WS26' },
      { id: 4, title: 'Summer 2026', shortTitle: null },
    ],
  },
  CourseGroupOptions: { CourseGroupOption: [{ id: 5, title: 'Tech & Coding' }] },
};

describe('ManageProjectsOverviewContent', () => {
  beforeEach(() => {
    mockIsAdmin = true;
    mockProvidedRole = undefined;
    tableGridProps.mockClear();
    managementRoles.mockClear();
    mockUseAdminQuery.mockReset();
    mockUseManageQuery.mockReset();
    mockUseManageQuery.mockImplementation((doc: unknown) => ({
      data: manageQueryData[operationName(doc) ?? ''],
      loading: false,
      refetch: jest.fn(),
    }));
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
    window.localStorage.clear();
  });

  it('loads the first page of 50 projects across all courses as admin', () => {
    render(<ManageProjectsOverviewContent />);

    expect(queryNames(mockUseManageQuery)).toEqual(expect.arrayContaining(['ProjectsOverview']));
    expect(lastVariables('ProjectsOverview')).toMatchObject({ limit: 50, offset: 0 });
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

    expect(lastVariables('ProjectsOverview')).toMatchObject({ limit: 50, offset: 50 });
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

const statusChip = (status: string) =>
  screen.getByRole('button', { name: new RegExp(`^projects\\.status\\.${status}\\s*[\\d–]*$`) });
const pressedStatuses = () =>
  [
    'TEMPLATE',
    'PROPOSED',
    'ONGOING',
    'SENT_BACK',
    'SUBMITTED',
    'COMPLETED_PASSED',
    'SUGGESTED_FOR_PUBLICATION',
    'PUBLISHED',
    'INCOMPLETE_FAILED',
  ].filter((status) => statusChip(status).getAttribute('aria-pressed') === 'true');
const listWhere = () => lastVariables('ProjectsOverview')?.where;

describe('ManageProjectsOverviewContent status chips, filters and search', () => {
  beforeEach(() => {
    mockIsAdmin = true;
    tableGridProps.mockClear();
    mockUseManageQuery.mockReset();
    mockUseManageQuery.mockImplementation((doc: unknown) => ({
      data: manageQueryData[operationName(doc) ?? ''],
      loading: false,
      refetch: jest.fn(),
    }));
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the nine statuses in lifecycle order with their counts', () => {
    render(<ManageProjectsOverviewContent />);

    const labels = screen
      .getAllByRole('button', { name: /^projects\.status\./ })
      .map((button) => button.textContent);
    expect(labels).toEqual([
      'projects.status.TEMPLATE10',
      'projects.status.PROPOSED11',
      'projects.status.ONGOING12',
      'projects.status.SENT_BACK13',
      'projects.status.SUBMITTED14',
      'projects.status.COMPLETED_PASSED15',
      'projects.status.SUGGESTED_FOR_PUBLICATION16',
      'projects.status.PUBLISHED17',
      'projects.status.INCOMPLETE_FAILED18',
    ]);
  });

  it("opens on the Admin's Needs Attention preset", () => {
    render(<ManageProjectsOverviewContent />);

    expect(pressedStatuses()).toEqual(['PROPOSED', 'SUBMITTED', 'SUGGESTED_FOR_PUBLICATION']);
    expect(screen.getByRole('button', { name: 'filter.needs_attention' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(listWhere()).toEqual({ projectStatusRank: { _in: [1, 4, 6] } });
  });

  it('clears the preset with one click and shows every project', () => {
    render(<ManageProjectsOverviewContent />);

    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));

    expect(pressedStatuses()).toEqual([]);
    expect(listWhere()).toEqual({});
    expect(screen.getByRole('button', { name: 'filter.needs_attention' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('selects several statuses at once and goes back to the first page', () => {
    render(<ManageProjectsOverviewContent />);
    act(() => lastTableProps().onPageChange(2));

    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));
    fireEvent.click(statusChip('SENT_BACK'));
    fireEvent.click(statusChip('ONGOING'));

    expect(pressedStatuses()).toEqual(['ONGOING', 'SENT_BACK']);
    expect(listWhere()).toEqual({ projectStatusRank: { _in: [2, 3] } });
    expect(lastVariables('ProjectsOverview')).toMatchObject({ offset: 0 });

    // Clicking a selected chip deselects it.
    fireEvent.click(statusChip('ONGOING'));
    expect(listWhere()).toEqual({ projectStatusRank: { _in: [3] } });
  });

  it('filters by program: any course the project is listed in', () => {
    render(<ManageProjectsOverviewContent />);

    fireEvent.change(screen.getByLabelText('filter.program_label'), { target: { value: '3' } });

    expect(listWhere()).toEqual({
      _and: [
        { ProjectCourses: { Course: { programId: { _eq: 3 } } } },
        { projectStatusRank: { _in: [1, 4, 6] } },
      ],
    });
  });

  it('filters by course group', () => {
    render(<ManageProjectsOverviewContent />);

    fireEvent.change(screen.getByLabelText('filter.course_group_label'), {
      target: { value: '5' },
    });

    expect(listWhere()).toEqual({
      _and: [
        {
          ProjectCourses: {
            Course: { CourseGroups: { CourseGroupOption: { id: { _eq: 5 } } } },
          },
        },
        { projectStatusRank: { _in: [1, 4, 6] } },
      ],
    });
  });

  it('searches titles, texts, people, course and program for keyword candidates', () => {
    jest.useFakeTimers();
    render(<ManageProjectsOverviewContent />);

    fireEvent.change(screen.getByLabelText('filter.search_label'), {
      target: { value: 'solar ada' },
    });
    // Debounced: nothing is sent while typing.
    expect(listWhere()).toEqual({ projectStatusRank: { _in: [1, 4, 6] } });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const fields = (word: string) => [
      { title: { _ilike: `%${word}%` } },
      { tagline: { _ilike: `%${word}%` } },
      { description: { _ilike: `%${word}%` } },
      { ProjectAuthors: { User: { firstName: { _ilike: `%${word}%` } } } },
      { ProjectAuthors: { User: { lastName: { _ilike: `%${word}%` } } } },
      { ProjectMentors: { User: { firstName: { _ilike: `%${word}%` } } } },
      { ProjectMentors: { User: { lastName: { _ilike: `%${word}%` } } } },
      { ProjectCourses: { Course: { title: { _ilike: `%${word}%` } } } },
      { ProjectCourses: { Course: { Program: { shortTitle: { _ilike: `%${word}%` } } } } },
      { ProjectCourses: { Course: { Program: { title: { _ilike: `%${word}%` } } } } },
    ];
    // A search of three or more characters is ranked: the statuses apply in the browser.
    expect(lastVariables('ProjectsOverview')).toEqual({
      where: { _and: [{ _or: fields('solar') }, { _or: fields('ada') }] },
      limit: 300,
      offset: 0,
    });
  });

  it('counts each status with the other filters applied, whatever chips are selected', () => {
    render(<ManageProjectsOverviewContent />);

    expect(lastVariables('ProjectsOverviewStatusCounts')).toMatchObject({
      TEMPLATE: { projectStatusRank: { _in: [0] } },
      INCOMPLETE_FAILED: { projectStatusRank: { _in: [8] } },
    });

    fireEvent.change(screen.getByLabelText('filter.program_label'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));

    const program = { ProjectCourses: { Course: { programId: { _eq: 4 } } } };
    const variables = lastVariables('ProjectsOverviewStatusCounts');
    expect(Object.keys(variables)).toHaveLength(9);
    expect(variables.SENT_BACK).toEqual({
      _and: [program, { projectStatusRank: { _in: [3] } }],
    });
    expect(variables.PUBLISHED).toEqual({
      _and: [program, { projectStatusRank: { _in: [7] } }],
    });
  });
});

describe('ProjectsOverviewFilters Needs Attention preset per role', () => {
  beforeEach(() => {
    mockIsAdmin = true;
    mockUseManageQuery.mockReset();
    mockUseManageQuery.mockImplementation((doc: unknown) => ({
      data: manageQueryData[operationName(doc) ?? ''],
      loading: false,
    }));
  });

  it.each([
    [AuthRoles.admin, ['PROPOSED', 'SUBMITTED', 'SUGGESTED_FOR_PUBLICATION']],
    [AuthRoles.org_admin, ['PROPOSED', 'SUBMITTED']],
  ])('%s starts on and restores %j', (role, expected) => {
    const onChange = jest.fn();
    render(
      <ProjectsOverviewFilters
        role={role}
        filters={defaultProjectsOverviewFilters(role)}
        onChange={onChange}
      />
    );

    expect(pressedStatuses()).toEqual(expected);
    expect(screen.getByRole('button', { name: 'filter.needs_attention' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: [] }));

    fireEvent.click(screen.getByRole('button', { name: 'filter.needs_attention' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: expected }));
  });
});

describe('ManageProjectsOverviewContent for Org Admins', () => {
  const publishedProject = { ...project, published: true, status: ProjectStatus_enum.COMPLETED };
  // The course-program branch of the Org Admin scope (manageScope.ts), for the test user.
  const coursesBranch = {
    _and: [
      { type: { _eq: 'COURSES' } },
      {
        Organization: {
          OrganizationAdmins: {
            _and: [{ userId: { _eq: 'admin-1' } }, { canManageCourses: { _eq: true } }],
          },
        },
      },
    ],
  };
  const orgAdminScope = {
    ProjectCourses: { Course: { _or: expect.arrayContaining([{ Program: coursesBranch }]) } },
  };

  const renderAs = (isAdmin: boolean) => {
    mockIsAdmin = isAdmin;
    render(<ManageProjectsOverviewContent />);
  };

  beforeEach(() => {
    mockProvidedRole = undefined;
    tableGridProps.mockClear();
    managementRoles.mockClear();
    mockUseAdminQuery.mockReset();
    mockUseManageQuery.mockReset();
    mockUseManageQuery.mockImplementation((doc: unknown) => ({
      data:
        operationName(doc) === 'ProjectsOverview'
          ? { Project: [publishedProject], Project_aggregate: { aggregate: { count: 1 } } }
          : manageQueryData[operationName(doc) ?? ''],
      loading: false,
      refetch: jest.fn(),
    }));
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
    window.localStorage.clear();
  });

  it('runs the page, its filters and the grid under the org_admin role', () => {
    renderAs(false);

    expect(queryNames(mockUseManageQuery)).toEqual(
      expect.arrayContaining([
        'ProjectsOverview',
        'ProjectsOverviewStatusCounts',
        'Programs',
        'CourseGroupOptions',
      ])
    );
    // Nothing on the page pins the admin role for an Org Admin.
    expect(mockUseAdminQuery).not.toHaveBeenCalled();
    expect(managementRoles).toHaveBeenCalledWith(AuthRoles.org_admin);
    expect(managementRoles).not.toHaveBeenCalledWith(AuthRoles.admin);
  });

  it("opens on the Org Admin's Needs Attention preset, limited to their programs", () => {
    renderAs(false);

    expect(pressedStatuses()).toEqual(['PROPOSED', 'SUBMITTED']);
    expect(listWhere()).toEqual({
      _and: [orgAdminScope, { projectStatusRank: { _in: [1, 4] } }],
    });
    expect(lastVariables('ProjectsOverviewStatusCounts').TEMPLATE).toEqual({
      _and: [orgAdminScope, { projectStatusRank: { _in: [0] } }],
    });
    // The program dropdown lists only the programs they manage.
    expect(lastVariables('Programs')).toEqual({
      where: { _or: expect.arrayContaining([coursesBranch]) },
    });
  });

  it('offers neither the publish action nor the settings links', () => {
    renderAs(false);

    expect(screen.getByRole('button', { name: 'projects.actions.preview' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'projects.actions.unpublish' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /settings_links/ })).not.toBeInTheDocument();
  });

  it('keeps publishing and the unscoped list for Admins', () => {
    renderAs(true);

    expect(screen.getByRole('button', { name: 'projects.actions.unpublish' })).toBeInTheDocument();
    expect(listWhere()).toEqual({ projectStatusRank: { _in: [1, 4, 6] } });
    expect(lastVariables('Programs')).toEqual({ where: {} });
  });
});

describe('ManageProjectsOverviewContent ranked search', () => {
  const solarBoat = { ...project, id: 1, title: 'Solar Boat' };
  const gardenSensors = {
    ...project,
    id: 2,
    title: 'Garden sensors',
    description: 'Solar powered soil sensors',
    sentBackAt: '2026-02-01T00:00:00Z',
  };
  const electricFerry = {
    ...project,
    id: 3,
    title: 'Electric ferry',
    status: ProjectStatus_enum.PROPOSED,
  };
  const everyProject = [solarBoat, gardenSensors, electricFerry];
  // Project 99 is close in meaning but outside the caller's filters, so loading it finds nothing.
  const matches = [
    { __typename: 'ProjectMatchResult', projectId: 3, similarity: 0.9 },
    { __typename: 'ProjectMatchResult', projectId: 99, similarity: 0.8 },
    { __typename: 'ProjectMatchResult', projectId: 1, similarity: 0.5 },
  ];
  const semanticResult = (overrides: Record<string, unknown> = {}) => ({
    semanticProjectSearch: {
      __typename: 'SemanticProjectSearchResult',
      success: true,
      enabled: true,
      matches,
      ...overrides,
    },
  });

  type Where = Record<string, any>;
  /** The ids a ProjectsOverview `where` asks for, when it loads the semantic matches. */
  const idsOf = (where: Where): number[] | undefined =>
    where?.id?._in ?? where?._and?.find((condition: Where) => condition.id)?.id._in;

  let semantic: unknown;
  beforeEach(() => {
    mockIsAdmin = true;
    semantic = semanticResult();
    tableGridProps.mockClear();
    mockUseManageQuery.mockReset();
    mockUseManageQuery.mockImplementation(
      (doc: unknown, options?: { skip?: boolean; variables?: Where }) => {
        const result = { loading: false, refetch: jest.fn() };
        if (options?.skip) return { ...result, data: undefined };
        const name = operationName(doc);
        if (name === 'SemanticProjectSearch') return { ...result, data: semantic };
        if (name === 'ProjectsOverview') {
          const ids = idsOf(options?.variables?.where);
          const rows = ids
            ? everyProject.filter((candidate) => ids.includes(candidate.id))
            : [solarBoat, gardenSensors];
          return {
            ...result,
            data: { Project: rows, Project_aggregate: { aggregate: { count: rows.length } } },
          };
        }
        return { ...result, data: manageQueryData[name ?? ''] };
      }
    );
    mockUseRoleQuery.mockReset();
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: false, refetch: jest.fn() });
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const search = (value: string) => {
    fireEvent.change(screen.getByLabelText('filter.search_label'), { target: { value } });
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };
  const rowIds = () => screen.queryAllByTestId(/^row-/).map((row) => row.dataset.testid);
  const sent = (name: string) =>
    mockUseManageQuery.mock.calls.filter(
      ([doc, options]) => operationName(doc) === name && !options?.skip
    );
  const searchCondition = (word: string) => ({
    _and: [{ _or: expect.arrayContaining([{ title: { _ilike: `%${word}%` } }]) }],
  });

  it('switches to ranked mode at three characters and ranks keyword and semantic hits together', () => {
    render(<ManageProjectsOverviewContent />);
    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));

    search('solar');

    expect(sent('SemanticProjectSearch').at(-1)?.[1].variables).toEqual({ query: 'solar' });
    // Found by both searches first, then the closest in meaning, then the weaker keyword hit.
    expect(rowIds()).toEqual(['row-1', 'row-3', 'row-2']);
    expect(screen.getByText('ranked_hint')).toBeInTheDocument();
    // Paged in the browser.
    expect(lastTableProps()).toMatchObject({ pageIndex: 0, pageSize: 50, totalCount: 3 });
  });

  it('loads keyword candidates and semantic matches with the active filters, statuses aside', () => {
    render(<ManageProjectsOverviewContent />);
    fireEvent.change(screen.getByLabelText('filter.program_label'), { target: { value: '3' } });

    search('solar');

    const program = { ProjectCourses: { Course: { programId: { _eq: 3 } } } };
    const calls = sent('ProjectsOverview').map(([, options]) => options.variables);
    const keyword = calls.filter((variables) => !idsOf(variables.where)).at(-1);
    const similar = calls.filter((variables) => idsOf(variables.where)).at(-1);
    expect(keyword).toEqual({
      where: { _and: [program, searchCondition('solar')] },
      limit: 300,
      offset: 0,
    });
    // The matches, closest first, loaded under the caller's role with the same filters.
    expect(similar?.where).toEqual({ _and: [program, { id: { _in: [3, 99, 1] } }] });
  });

  it('filters the ranked results by status and counts them on the chips', () => {
    render(<ManageProjectsOverviewContent />);
    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));

    search('solar');

    expect(screen.getByTestId('status-count-ONGOING')).toHaveTextContent('1');
    expect(screen.getByTestId('status-count-SENT_BACK')).toHaveTextContent('1');
    expect(screen.getByTestId('status-count-PROPOSED')).toHaveTextContent('1');
    expect(screen.getByTestId('status-count-PUBLISHED')).toHaveTextContent('0');
    // Counted in the browser: the server's counts would only see keyword matches.
    const countQueries = mockUseManageQuery.mock.calls.filter(
      ([doc]) => operationName(doc) === 'ProjectsOverviewStatusCounts'
    );
    expect(countQueries.at(-1)?.[1].skip).toBe(true);

    fireEvent.click(statusChip('SENT_BACK'));
    expect(rowIds()).toEqual(['row-2']);
    // The chips keep counting every ranked result, whatever is selected.
    expect(screen.getByTestId('status-count-ONGOING')).toHaveTextContent('1');
  });

  it('applies the Needs Attention preset to the ranked results too', () => {
    render(<ManageProjectsOverviewContent />);

    search('solar');

    // Only the Awaiting Confirmation project is in the Admin's preset.
    expect(rowIds()).toEqual(['row-3']);
  });

  it.each([
    ['fails', { success: false, matches: [] }],
    ['is turned off', { enabled: false, matches: [] }],
  ])('shows keyword results with a note when semantic search %s', (_, overrides) => {
    semantic = semanticResult(overrides);
    render(<ManageProjectsOverviewContent />);
    fireEvent.click(screen.getByRole('button', { name: 'filter.show_all' }));

    search('solar');

    expect(screen.getByText('semantic_unavailable')).toBeInTheDocument();
    expect(rowIds()).toEqual(['row-1', 'row-2']);
  });

  it('keeps shorter searches paged on the server', () => {
    render(<ManageProjectsOverviewContent />);

    search('so');

    expect(sent('SemanticProjectSearch')).toHaveLength(0);
    expect(lastVariables('ProjectsOverview')).toEqual({
      where: { _and: [searchCondition('so'), { projectStatusRank: { _in: [1, 4, 6] } }] },
      limit: 50,
      offset: 0,
    });
    expect(screen.queryByText('ranked_hint')).not.toBeInTheDocument();
    expect(screen.queryByText('semantic_unavailable')).not.toBeInTheDocument();
  });
});
