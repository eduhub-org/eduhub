import { Project_bool_exp } from '../../../__generated__/globalTypes';
import { createMultiWordSearchCondition } from '../../../helpers/searchUtils';
import { AuthRoles } from '../../../types/enums';
import { ProjectsOverviewStatusCountsVariables } from '../../../queries/__generated__/ProjectsOverviewStatusCounts';
import {
  needsAttentionStatuses,
  PROJECT_STATUSES,
  ProjectStatusKey,
  projectStatusWhere,
} from '../CourseContent/Projects/projectStatusDisplay';

export interface ProjectsOverviewFilterState {
  /** Selected Project Statuses; none selected shows every status. */
  statuses: ProjectStatusKey[];
  /** Program id as a string ('' = all programs). */
  programId: string;
  /** Course group option id as a string ('' = all course groups). */
  courseGroupId: string;
  search: string;
}

/** The overview opens on the viewer's Needs Attention statuses, with no other filter. */
export function defaultProjectsOverviewFilters(role: AuthRoles | string): ProjectsOverviewFilterState {
  return { statuses: needsAttentionStatuses(role), programId: '', courseGroupId: '', search: '' };
}

/**
 * Keyword search fields: title, tagline, description, author and mentor names, and the course
 * and program a project is listed in (courses have no short title, so their title is used).
 */
export const PROJECTS_OVERVIEW_SEARCH_FIELDS = [
  'title',
  'tagline',
  'description',
  'ProjectAuthors.User.firstName',
  'ProjectAuthors.User.lastName',
  'ProjectMentors.User.firstName',
  'ProjectMentors.User.lastName',
  'ProjectCourses.Course.title',
  'ProjectCourses.Course.Program.shortTitle',
];

const and = (conditions: Project_bool_exp[]): Project_bool_exp => {
  const nonEmpty = conditions.filter((condition) => Object.keys(condition).length > 0);
  if (nonEmpty.length <= 1) {
    return nonEmpty[0] ?? {};
  }
  return { _and: nonEmpty };
};

/**
 * Every active filter except the status chips (the status counts apply these too), within the
 * viewer's `scope` (empty for Admins; an Org Admin's programs, see useManageProjectWhere).
 */
export function projectsOverviewBaseWhere(
  filters: Omit<ProjectsOverviewFilterState, 'statuses'>,
  scope: Project_bool_exp = {}
): Project_bool_exp {
  const conditions: Project_bool_exp[] = [scope];
  // A project is in a program (or course group) if any course it is listed in is.
  if (filters.programId) {
    conditions.push({
      ProjectCourses: { Course: { programId: { _eq: Number(filters.programId) } } },
    });
  }
  if (filters.courseGroupId) {
    conditions.push({
      ProjectCourses: {
        Course: {
          CourseGroups: { CourseGroupOption: { id: { _eq: Number(filters.courseGroupId) } } },
        },
      },
    });
  }
  conditions.push(
    createMultiWordSearchCondition(filters.search, PROJECTS_OVERVIEW_SEARCH_FIELDS) as Project_bool_exp
  );
  return and(conditions);
}

/**
 * The projects among `projectIds` (the semantic matches of a ranked search) that pass the program
 * and course-group filters within the viewer's `scope`; the search words and statuses are left out.
 */
export function projectsOverviewMatchesWhere(
  filters: Omit<ProjectsOverviewFilterState, 'statuses' | 'search'>,
  scope: Project_bool_exp,
  projectIds: number[]
): Project_bool_exp {
  return and([
    projectsOverviewBaseWhere({ ...filters, search: '' }, scope),
    { id: { _in: projectIds } },
  ]);
}

/** The `where` of the overview's project list. */
export function projectsOverviewWhere(
  filters: ProjectsOverviewFilterState,
  scope: Project_bool_exp = {}
): Project_bool_exp {
  return and([projectsOverviewBaseWhere(filters, scope), projectStatusWhere(filters.statuses)]);
}

/** One `where` per Project Status: the active filters plus that status. */
export function projectsOverviewStatusCountVariables(
  filters: Omit<ProjectsOverviewFilterState, 'statuses'>,
  scope: Project_bool_exp = {}
): ProjectsOverviewStatusCountsVariables {
  const base = projectsOverviewBaseWhere(filters, scope);
  return Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, and([base, projectStatusWhere([status])])])
  ) as unknown as ProjectsOverviewStatusCountsVariables;
}
