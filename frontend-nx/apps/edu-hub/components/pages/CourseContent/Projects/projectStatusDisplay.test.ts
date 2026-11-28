import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../__generated__/globalTypes';
import { AuthRoles } from '../../../../types/enums';
import {
  getProjectStatusChipKey,
  isPassedProject,
  isProjectTypeEditable,
  needsAttentionStatuses,
  PROJECT_STATUSES,
  projectStatusRank,
  projectStatusWhere,
} from './projectStatusDisplay';

describe('isProjectTypeEditable', () => {
  // Table-driven over the whole enum so a new status forces an explicit decision.
  const expected: Record<ProjectStatus_enum, boolean> = {
    [ProjectStatus_enum.PROPOSED]: true,
    // Instructors may still correct the type after confirming the team, and
    // again after a send-back (SUBMITTED -> ONGOING).
    [ProjectStatus_enum.ONGOING]: true,
    [ProjectStatus_enum.SUBMITTED]: false,
    [ProjectStatus_enum.COMPLETED]: false,
    [ProjectStatus_enum.INCOMPLETE]: false,
    [ProjectStatus_enum.PUBLISHED]: false,
  };

  it.each(Object.entries(expected))('%s -> %s', (status, editable) => {
    expect(isProjectTypeEditable(status as ProjectStatus_enum)).toBe(editable);
  });
});

describe('isPassedProject', () => {
  // Table-driven over the whole enum so a new status forces an explicit decision.
  const expected: Record<ProjectStatus_enum, boolean> = {
    [ProjectStatus_enum.PROPOSED]: false,
    [ProjectStatus_enum.ONGOING]: false,
    [ProjectStatus_enum.SUBMITTED]: false,
    [ProjectStatus_enum.COMPLETED]: true,
    // Rated as not passed: may be deleted.
    [ProjectStatus_enum.INCOMPLETE]: false,
    [ProjectStatus_enum.PUBLISHED]: true,
  };

  it.each(Object.entries(expected))('%s -> %s', (status, passed) => {
    expect(
      isPassedProject({ status: status as ProjectStatus_enum, published: false })
    ).toBe(passed);
  });

  it('treats a project shown in the showcase as passed whatever its status', () => {
    expect(
      isPassedProject({ status: ProjectStatus_enum.INCOMPLETE, published: true })
    ).toBe(true);
  });
});

describe('Project Status (overview chips and server filter)', () => {
  it('lists the nine statuses in lifecycle order, ranked like project_status_rank', () => {
    // Must match the CASE in the SQL function public.project_status_rank.
    expect(PROJECT_STATUSES.map((status) => [status, projectStatusRank(status)])).toEqual([
      ['TEMPLATE', 0],
      ['PROPOSED', 1],
      ['ONGOING', 2],
      ['SENT_BACK', 3],
      ['SUBMITTED', 4],
      ['COMPLETED_PASSED', 5],
      ['SUGGESTED_FOR_PUBLICATION', 6],
      ['PUBLISHED', 7],
      ['INCOMPLETE_FAILED', 8],
    ]);
  });

  it('filters on the computed rank, sorted and without duplicates', () => {
    expect(projectStatusWhere(['SUBMITTED', 'PROPOSED', 'SUBMITTED'])).toEqual({
      projectStatusRank: { _in: [1, 4] },
    });
  });

  it('does not restrict when no status is selected', () => {
    expect(projectStatusWhere([])).toEqual({});
  });

  it('Needs Attention includes publication for Admins only', () => {
    expect(needsAttentionStatuses(AuthRoles.admin)).toEqual([
      'PROPOSED',
      'SUBMITTED',
      'SUGGESTED_FOR_PUBLICATION',
    ]);
    expect(needsAttentionStatuses(AuthRoles.org_admin)).toEqual(['PROPOSED', 'SUBMITTED']);
  });
});

describe('getProjectStatusChipKey', () => {
  const base = {
    status: ProjectStatus_enum.PROPOSED,
    ProjectAuthors: [{ participationStatus: ProjectParticipationStatus_enum.ACCEPTED }],
    suggestedForPublication: false,
    published: false,
    sentBackAt: null,
  };

  // One case per branch of the SQL function project_status_rank, so a status lands in the same
  // chip on the row as in the overview's filter.
  it.each([
    ['TEMPLATE', { ProjectAuthors: [] }],
    ['TEMPLATE', { ProjectAuthors: [], published: true }],
    ['PROPOSED', {}],
    ['ONGOING', { status: ProjectStatus_enum.ONGOING }],
    ['SENT_BACK', { status: ProjectStatus_enum.ONGOING, sentBackAt: '2026-08-20T09:00:00Z' }],
    ['SUBMITTED', { status: ProjectStatus_enum.SUBMITTED }],
    ['COMPLETED_PASSED', { status: ProjectStatus_enum.COMPLETED }],
    [
      'SUGGESTED_FOR_PUBLICATION',
      { status: ProjectStatus_enum.COMPLETED, suggestedForPublication: true },
    ],
    [
      'PUBLISHED',
      { status: ProjectStatus_enum.COMPLETED, suggestedForPublication: true, published: true },
    ],
    ['PUBLISHED', { status: ProjectStatus_enum.PUBLISHED }],
    ['INCOMPLETE_FAILED', { status: ProjectStatus_enum.INCOMPLETE }],
  ])('%s for %j', (expected, overrides) => {
    expect(getProjectStatusChipKey({ ...base, ...overrides } as never)).toBe(expected);
  });
});
