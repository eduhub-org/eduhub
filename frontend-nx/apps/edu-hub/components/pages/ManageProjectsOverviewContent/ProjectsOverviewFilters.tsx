import { ChangeEvent, FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDebouncedCallback } from 'use-debounce';
import TextField from '@mui/material/TextField';

import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { Project_bool_exp } from '../../../__generated__/globalTypes';
import { AuthRoles } from '../../../types/enums';
import { isKnownCourseGroupOptionTitle } from '../../../helpers/courseGroupOptions';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { COURSE_GROUP_OPTIONS } from '../../../queries/courseGroupOptions';
import { PROJECTS_OVERVIEW_STATUS_COUNTS } from '../../../queries/project';
import { Programs } from '../../../queries/__generated__/Programs';
import { CourseGroupOptions } from '../../../queries/__generated__/CourseGroupOptions';
import {
  ProjectsOverviewStatusCounts,
  ProjectsOverviewStatusCountsVariables,
} from '../../../queries/__generated__/ProjectsOverviewStatusCounts';
import DropDownSelector from '../../inputs/DropDownSelector';
import {
  needsAttentionStatuses,
  PROJECT_STATUSES,
  ProjectStatusKey,
} from '../CourseContent/Projects/projectStatusDisplay';
import { ProjectsOverviewFilterState, projectsOverviewStatusCountVariables } from './projectsOverviewWhere';

const SEARCH_DEBOUNCE_MS = 400;

const FilterChip: FC<{ active: boolean; onClick: () => void; children: ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-brand bg-bg-secondary text-label-primary'
        : 'border-border-primary text-label-secondary hover:border-brand'
    }`}
  >
    {children}
  </button>
);

const sameStatuses = (a: readonly ProjectStatusKey[], b: readonly ProjectStatusKey[]) =>
  a.length === b.length && a.every((status) => b.includes(status));

interface ProjectsOverviewFiltersProps {
  /** The viewer's management role; decides the Needs Attention preset. */
  role: AuthRoles;
  /** The projects the viewer may see (empty for Admins); the status counts stay within it. */
  scope?: Project_bool_exp;
  filters: ProjectsOverviewFilterState;
  onChange: (filters: ProjectsOverviewFilterState) => void;
}

/**
 * Status chips with counts (multi-select, Needs Attention preset), program and course-group
 * filters and keyword search for the projects overview. Everything is applied on the server,
 * under the viewer's management role (admin or org_admin).
 */
const ProjectsOverviewFilters: FC<ProjectsOverviewFiltersProps> = ({
  role,
  scope,
  filters,
  onChange,
}) => {
  const t = useTranslations('projectsOverview');
  const tCourse = useTranslations('course');
  const tCommon = useTranslations('common');

  // Org Admins only get their own programs to choose from.
  const programWhere = useManageProgramWhere();
  const { data: programsData } = useManageQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES, {
    variables: { where: programWhere },
  });
  const { data: courseGroupData } = useManageQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  const { programId, courseGroupId, search } = filters;
  const countVariables = useMemo(
    () => projectsOverviewStatusCountVariables({ programId, courseGroupId, search }, scope),
    [programId, courseGroupId, search, scope]
  );
  const countsQuery = useManageQuery<ProjectsOverviewStatusCounts, ProjectsOverviewStatusCountsVariables>(
    PROJECTS_OVERVIEW_STATUS_COUNTS,
    { variables: countVariables }
  );
  const counts = countsQuery.data ?? countsQuery.previousData;

  const programOptions = useMemo(
    () =>
      (programsData?.Program ?? []).map((program) => ({
        value: String(program.id),
        label: program.shortTitle || program.title || String(program.id),
      })),
    [programsData?.Program]
  );

  const courseGroupOptions = useMemo(
    () =>
      (courseGroupData?.CourseGroupOption ?? []).map((option) => ({
        value: String(option.id),
        label: isKnownCourseGroupOptionTitle(option.title)
          ? tCommon(`course_group_options.${option.title}`)
          : option.title,
      })),
    [courseGroupData?.CourseGroupOption, tCommon]
  );

  const preset = useMemo(() => needsAttentionStatuses(role), [role]);
  const presetActive = sameStatuses(filters.statuses, preset);

  const toggleStatus = (status: ProjectStatusKey) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : PROJECT_STATUSES.filter((s) => s === status || filters.statuses.includes(s));
    onChange({ ...filters, statuses });
  };

  const [searchInput, setSearchInput] = useState(filters.search);
  // The latest filters, so a debounced search doesn't undo a chip clicked while typing.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const commitSearch = useDebouncedCallback((value: string) => {
    onChange({ ...filtersRef.current, search: value.trim() });
  }, SEARCH_DEBOUNCE_MS);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
      commitSearch(event.target.value);
    },
    [commitSearch]
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('filter.status_label')}>
        <FilterChip
          active={presetActive}
          onClick={() => onChange({ ...filters, statuses: preset })}
        >
          {t('filter.needs_attention')}
        </FilterChip>
        <button
          type="button"
          onClick={() => onChange({ ...filters, statuses: [] })}
          disabled={filters.statuses.length === 0}
          className="px-2 py-1 text-sm text-label-secondary underline disabled:no-underline disabled:opacity-50"
        >
          {t('filter.show_all')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PROJECT_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={filters.statuses.includes(status)}
            onClick={() => toggleStatus(status)}
          >
            <span>{tCourse(`projects.status.${status}`)}</span>
            <span
              className="rounded-full bg-bg-card px-2 text-xs font-semibold text-label-primary"
              data-testid={`status-count-${status}`}
            >
              {counts?.[status]?.aggregate?.count ?? '–'}
            </span>
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <DropDownSelector
          variant="material"
          label={t('filter.program_label')}
          value={filters.programId}
          options={programOptions}
          nullable
          nullableLabel={t('filter.all_programs')}
          onValueUpdated={(value: string) => onChange({ ...filters, programId: value ?? '' })}
          className="min-w-[14rem]"
        />
        <DropDownSelector
          variant="material"
          label={t('filter.course_group_label')}
          value={filters.courseGroupId}
          options={courseGroupOptions}
          nullable
          nullableLabel={t('filter.all_course_groups')}
          onValueUpdated={(value: string) => onChange({ ...filters, courseGroupId: value ?? '' })}
          className="min-w-[14rem]"
        />
        <TextField
          value={searchInput}
          onChange={handleSearchChange}
          label={t('filter.search_label')}
          placeholder={t('filter.search_placeholder')}
          variant="outlined"
          size="small"
          sx={{
            width: { xs: '100%', sm: '20rem' },
            backgroundColor: 'var(--eduhub-bg-card)',
            '& .MuiInputBase-input': { color: 'var(--eduhub-label-primary)' },
            '& .MuiInputLabel-root': { color: 'var(--eduhub-label-primary)' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--eduhub-border-primary)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--eduhub-brand)' },
          }}
        />
      </div>
    </div>
  );
};

export default ProjectsOverviewFilters;
