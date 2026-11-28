import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageRole } from '../../../hooks/authentication';
import { useManageProjectWhere } from '../../../hooks/manageScope';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { PROJECTS_OVERVIEW } from '../../../queries/project';
import {
  ProjectsOverview,
  ProjectsOverviewVariables,
  ProjectsOverview_Project_courses,
} from '../../../queries/__generated__/ProjectsOverview';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { usePersistedPageSize } from '../../common/TableGrid/hooks';
import ProjectsManagementGrid, {
  ProjectsGridExtraColumn,
} from '../ManageCourseContent/CourseParticipationsTab/projects/ProjectsManagementGrid';
import ProjectsOverviewSettingsLinks from './ProjectsOverviewSettingsLinks';
import ProjectsOverviewFilters from './ProjectsOverviewFilters';
import {
  defaultProjectsOverviewFilters,
  ProjectsOverviewFilterState,
  projectsOverviewWhere,
} from './projectsOverviewWhere';
import { useRankedProjects } from './useRankedProjects';

export const PROJECTS_OVERVIEW_PAGE_SIZE = 50;
const REFETCH_QUERIES = ['ProjectsOverview', 'ProjectsOverviewStatusCounts'];

const CourseList: FC<{ courses: ProjectsOverview_Project_courses[] }> = ({ courses }) => {
  const t = useTranslations('projectsOverview');
  if (courses.length === 0) {
    return <span className="text-label-secondary">{t('no_courses')}</span>;
  }
  return (
    <ul className="space-y-1">
      {courses.map((course) => (
        <li key={course.id} className="min-w-0 break-words">
          <span>{course.title}</span>
          <span className="text-label-secondary">
            {' · '}
            {course.Program.shortTitle || course.Program.title}
          </span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Every project across all courses, for Admins, and across their organization's programs, for
 * Org Admins: the course tab's project grid fed by a cross-course query, paged on the server and
 * sorted by Project Status, then last update. A search of three or more characters instead shows
 * keyword and semantic hits ranked by relevance, paged in the browser (useRankedProjects). Runs
 * under the viewer's management role.
 */
const ManageProjectsOverviewContent: FC = () => {
  const t = useTranslations('projectsOverview');
  // admin for Admins, org_admin for Org Admins: the page's queries, its filters and the grid.
  const role = useManageRole();
  // Hasura already limits what an Org Admin can read, but their reads are unioned with public
  // read; this keeps other organizations' published projects out of the list and the counts.
  const scope = useManageProjectWhere();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize(
    'projectsOverview',
    PROJECTS_OVERVIEW_PAGE_SIZE
  );
  const [filters, setFilters] = useState<ProjectsOverviewFilterState>(() =>
    defaultProjectsOverviewFilters(role)
  );
  const where = useMemo(() => projectsOverviewWhere(filters, scope), [filters, scope]);
  const handleFiltersChange = useCallback((next: ProjectsOverviewFilterState) => {
    setFilters(next);
    setPageIndex(0);
  }, []);

  const ranked = useRankedProjects({ filters, scope });
  const query = useManageQuery<ProjectsOverview, ProjectsOverviewVariables>(
    PROJECTS_OVERVIEW,
    { variables: { where, limit: pageSize, offset: pageIndex * pageSize }, skip: ranked.active }
  );
  // Keep the last page on screen while the next one loads.
  const data = query.data ?? query.previousData;

  const projects = useMemo(
    () =>
      ranked.active
        ? ranked.rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
        : data?.Project,
    [ranked.active, ranked.rows, pageIndex, pageSize, data?.Project]
  );
  const totalCount = ranked.active
    ? ranked.rows.length
    : data?.Project_aggregate.aggregate?.count ?? 0;

  const coursesByProjectId = useMemo(() => {
    const map = new Map<number, ProjectsOverview_Project_courses[]>();
    for (const project of projects ?? []) {
      map.set(project.id, project.courses ?? []);
    }
    return map;
  }, [projects]);

  const extraColumns = useMemo<ProjectsGridExtraColumn[]>(
    () => [
      {
        id: 'courses',
        header: t('courses_column'),
        render: (project) => <CourseList courses={coursesByProjectId.get(project.id) ?? []} />,
      },
    ],
    [coursesByProjectId, t]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    [setPageSize]
  );

  const { refetch } = query;
  const { active: rankedActive, refetch: refetchRanked } = ranked;
  const handleRefetch = useCallback(
    () => (rankedActive ? refetchRanked() : refetch()),
    [rankedActive, refetchRanked, refetch]
  );

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <CommonPageHeader headline={t('headline')} />
        <ProjectsOverviewSettingsLinks />
        <ProjectsOverviewFilters
          role={role}
          scope={scope}
          filters={filters}
          onChange={handleFiltersChange}
          counts={ranked.active ? ranked.counts : undefined}
        />
        {ranked.active && (
          <div className="mb-4 space-y-1 text-sm text-label-secondary">
            <p>{t('ranked_hint')}</p>
            {ranked.keywordTotal > ranked.keywordRanked && (
              <p>
                {t('ranked_capped', { ranked: ranked.keywordRanked, total: ranked.keywordTotal })}
              </p>
            )}
            {ranked.semanticUnavailable && <p>{t('semantic_unavailable')}</p>}
          </div>
        )}
        {/* The grid's own queries, mutations and inputs run under the same role. Publishing
            shows only under admin (ProjectShowcaseActions). */}
        <ManagementRoleProvider role={role}>
          <ProjectsManagementGrid
            projects={projects}
            loading={ranked.active ? ranked.loading : query.loading}
            error={ranked.active ? ranked.error : query.error}
            refetchQueries={REFETCH_QUERIES}
            onRefetch={handleRefetch}
            extraColumns={extraColumns}
            pagination={{
              pageIndex,
              pageSize,
              totalCount,
              onPageChange: setPageIndex,
              onPageSizeChange: handlePageSizeChange,
            }}
            // Defaults differ per course and program; on this cross-course page each project
            // shows its own values only.
            programDefaultProjectType={null}
            courseDefaultProjectSubmissionDeadline={null}
            courseSubmissionDeadlineDefaultSource={null}
          />
        </ManagementRoleProvider>
      </div>
    </PageBlock>
  );
};

export default ManageProjectsOverviewContent;
