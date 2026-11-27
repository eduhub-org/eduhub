import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { AuthRoles } from '../../../types/enums';
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
 * Every project across all courses, for Admins: the course tab's project grid fed by a
 * cross-course query, paged on the server and sorted by Project Status, then last update.
 */
const ManageProjectsOverviewContent: FC = () => {
  const t = useTranslations('projectsOverview');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize(
    'projectsOverview',
    PROJECTS_OVERVIEW_PAGE_SIZE
  );
  const [filters, setFilters] = useState<ProjectsOverviewFilterState>(() =>
    defaultProjectsOverviewFilters(AuthRoles.admin)
  );
  const where = useMemo(() => projectsOverviewWhere(filters), [filters]);
  const handleFiltersChange = useCallback((next: ProjectsOverviewFilterState) => {
    setFilters(next);
    setPageIndex(0);
  }, []);

  const query = useAdminQuery<ProjectsOverview, ProjectsOverviewVariables>(
    PROJECTS_OVERVIEW,
    { variables: { where, limit: pageSize, offset: pageIndex * pageSize } }
  );
  // Keep the last page on screen while the next one loads.
  const data = query.data ?? query.previousData;

  const coursesByProjectId = useMemo(() => {
    const map = new Map<number, ProjectsOverview_Project_courses[]>();
    for (const project of data?.Project ?? []) {
      map.set(project.id, project.courses ?? []);
    }
    return map;
  }, [data?.Project]);

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

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <CommonPageHeader headline={t('headline')} />
        <ProjectsOverviewSettingsLinks />
        <ProjectsOverviewFilters
          role={AuthRoles.admin}
          filters={filters}
          onChange={handleFiltersChange}
        />
        {/* The grid's own queries, mutations and inputs run as admin too. */}
        <ManagementRoleProvider role={AuthRoles.admin}>
          <ProjectsManagementGrid
            projects={data?.Project}
            loading={query.loading}
            error={query.error}
            refetchQueries={REFETCH_QUERIES}
            onRefetch={() => refetch()}
            extraColumns={extraColumns}
            pagination={{
              pageIndex,
              pageSize,
              totalCount: data?.Project_aggregate.aggregate?.count ?? 0,
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
