import { FC, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';
import {
  order_by,
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../__generated__/globalTypes';
import { ADMIN_PROJECT_LIST, UPDATE_PROJECT_PUBLISHED } from '../../../queries/adminProjectList';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { COURSE_GROUP_OPTIONS } from '../../../queries/courseGroupOptions';
import { AdminProjectList, AdminProjectList_Project } from '../../../queries/__generated__/AdminProjectList';
import {
  UpdateProjectPublished,
  UpdateProjectPublishedVariables,
} from '../../../queries/__generated__/UpdateProjectPublished';
import { Programs } from '../../../queries/__generated__/Programs';
import { CourseGroupOptions } from '../../../queries/__generated__/CourseGroupOptions';

import TableGrid from '../../common/TableGrid';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import CommonPageHeader from '../../common/CommonPageHeader';
import DropDownSelector from '../../inputs/DropDownSelector';
import { Button } from '../../common/Button';

import StatusChip from '../CourseContent/Projects/StatusChip';
import ProjectPreviewLayout from '../CourseContent/Projects/ProjectPreviewLayout';
import ProjectReviewComment from '../CourseContent/Projects/ProjectReviewComment';
import { getDisplayAuthors } from '../CourseContent/Projects/projectAuthors';
import {
  getProjectStatusChipKey,
  PROJECT_TYPE_ONLINE_COURSE,
  shouldShowProjectResourceDownloadLinks,
} from '../CourseContent/Projects/projectStatusDisplay';
import { ProjectRow } from '../CourseContent/Projects/types';
import { formatTruncatedList, makeFullName } from '../../../helpers/util';
import { isKnownCourseGroupOptionTitle } from '../../../helpers/courseGroupOptions';

const QUERY_LIMIT = 50;

// Rows shown on the cross-course overview (see plan / product decision):
//   1. COMPLETED projects that are NOT online courses,
//   2. template projects (PROPOSED with no ACCEPTED author), any type,
//   3. every published project (so a row stays visible to be unpublished again).
const PROJECT_LIST_SCOPE_WHERE = {
  _or: [
    { published: { _eq: true } },
    {
      _and: [
        { status: { _eq: ProjectStatus_enum.COMPLETED } },
        { _not: { type: { _eq: PROJECT_TYPE_ONLINE_COURSE } } },
      ],
    },
    {
      _and: [
        { status: { _eq: ProjectStatus_enum.PROPOSED } },
        {
          _not: {
            ProjectAuthors: { participationStatus: { _eq: ProjectParticipationStatus_enum.ACCEPTED } },
          },
        },
      ],
    },
  ],
};

type ManageProjectsContentProps = {
  /** When true, rendered inside SettingsLayout (no page header / max-width wrapper). */
  inSettingsLayout?: boolean;
};

const ManageProjectsContent: FC<ManageProjectsContentProps> = ({ inSettingsLayout = false }) => {
  const t = useTranslations('manageProjects');
  const tCommon = useTranslations('common');

  const [programFilter, setProgramFilter] = useState('');
  const [courseGroupFilter, setCourseGroupFilter] = useState('');

  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter dropdown option sources
  const { data: programsData } = useAdminQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES);
  const { data: courseGroupData } = useAdminQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  const courseGroupLabel = useCallback(
    (title: string | null) => {
      if (!title) return '';
      return isKnownCourseGroupOptionTitle(title) ? tCommon(`course_group_options.${title}`) : title;
    },
    [tCommon]
  );

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
        label: courseGroupLabel(option.title),
      })),
    [courseGroupData?.CourseGroupOption, courseGroupLabel]
  );

  const { data, loading, error, searchFilter, pageIndex, sorting, setSearchFilter, setPageIndex, setSorting } =
    useTableGrid({
      queryHook: useAdminQuery,
      query: ADMIN_PROJECT_LIST,
      pageSize: QUERY_LIMIT,
      debounceMs: 1000,
      defaultSort: [{ updated_at: order_by.desc }],
      sortColumnMapper: (columnId) => {
        const mapping: Record<string, string> = {
          title: 'title',
          status: 'status',
        };
        return mapping[columnId] || null;
      },
      refetchFilter: useCallback(
        (searchTerm: string) => {
          const conditions: Record<string, any>[] = [PROJECT_LIST_SCOPE_WHERE];
          if (programFilter) {
            conditions.push({ ProjectCourses: { Course: { programId: { _eq: Number(programFilter) } } } });
          }
          if (courseGroupFilter) {
            conditions.push({
              ProjectCourses: {
                Course: { CourseGroups: { CourseGroupOption: { id: { _eq: Number(courseGroupFilter) } } } },
              },
            });
          }
          const searchCondition = createMultiWordSearchCondition(searchTerm, [
            'title',
            'description',
            'ProjectAuthors.User.firstName',
            'ProjectAuthors.User.lastName',
            'ProjectAuthors.User.email',
          ]);
          if (Object.keys(searchCondition).length > 0) {
            conditions.push(searchCondition);
          }
          return { where: { _and: conditions } };
        },
        [programFilter, courseGroupFilter]
      ),
    });

  const projects: AdminProjectList_Project[] = useMemo(
    () => (data as AdminProjectList | undefined)?.Project ?? [],
    [data]
  );
  const totalCount = (data as AdminProjectList | undefined)?.Project_aggregate?.aggregate?.count || 0;

  const [updatePublished] = useAdminMutation<UpdateProjectPublished, UpdateProjectPublishedVariables>(
    UPDATE_PROJECT_PUBLISHED,
    { refetchQueries: ['AdminProjectList'] }
  );

  const handleTogglePublish = useCallback(
    async (project: AdminProjectList_Project) => {
      const publishing = !project.published;
      try {
        await updatePublished({
          variables: {
            itemId: project.id,
            published: publishing,
            // Publishing fulfils the recommendation; unpublishing leaves it as-is.
            suggestedForPublication: publishing ? false : project.suggestedForPublication ?? false,
          },
        });
        setSuccessMessage(publishing ? t('notifications.publish_success') : t('notifications.unpublish_success'));
        setShowSuccessNotification(true);
      } catch (err) {
        console.error('Error updating project publication status:', err);
        setErrorMessage(t('notifications.action_failed'));
        setShowErrorNotification(true);
      }
    },
    [updatePublished, t]
  );

  const handleProgramFilterChange = useCallback(
    (value: string) => {
      setProgramFilter(value);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const handleCourseGroupFilterChange = useCallback(
    (value: string) => {
      setCourseGroupFilter(value);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const columns = useMemo<ColumnDef<AdminProjectList_Project>[]>(
    () => [
      {
        id: 'title',
        header: t('table.title'),
        accessorKey: 'title',
        enableSorting: true,
        size: 320,
        minSize: 200,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{row.original.title}</span>
            <StatusChip
              displayKey={getProjectStatusChipKey(row.original as ProjectRow)}
              status={row.original.status}
              ratingComment={row.original.ratingComment}
            />
            {row.original.published && (
              <StatusChip displayKey="PUBLISHED" status={row.original.status} />
            )}
          </div>
        ),
      },
      {
        id: 'authors',
        header: t('table.authors'),
        enableSorting: false,
        size: 240,
        cell: ({ row }) => {
          const authors = getDisplayAuthors(row.original.ProjectAuthors, { includeExcluded: true });
          if (authors.length === 0) {
            return <span className="text-label-secondary">{t('table.no_authors')}</span>;
          }
          return (
            <span>
              {formatTruncatedList(authors, (a) =>
                makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')
              )}
            </span>
          );
        },
      },
      {
        id: 'program',
        header: t('table.program'),
        enableSorting: false,
        size: 200,
        cell: ({ row }) => {
          const course = row.original.ProjectCourses?.[0]?.Course;
          if (!course) {
            return <span className="text-label-secondary">—</span>;
          }
          const program = course.Program;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{program?.shortTitle || program?.title || '—'}</span>
              <span className="text-xs text-label-secondary">{course.title}</span>
            </div>
          );
        },
      },
      {
        id: 'published',
        header: t('table.published'),
        enableSorting: false,
        size: 160,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const project = row.original;
          const published = project.published;
          // Publication is orthogonal to the lifecycle status, so any project in
          // scope can be toggled without a status transition (no DB constraint).
          return (
            <div className="flex flex-col items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${published ? 'bg-success' : 'bg-fill-disabled'}`}
                title={published ? t('table.published') : t('table.not_published')}
              />
              <Button onClick={() => handleTogglePublish(project)} className="w-full">
                {published ? t('actions.unpublish') : t('actions.publish')}
              </Button>
            </div>
          );
        },
      },
    ],
    [handleTogglePublish, t]
  );

  const expandableRowComponent = useCallback(
    ({ row }: { row: AdminProjectList_Project }) => (
      <div className="p-4 space-y-4">
        <ProjectReviewComment ratingComment={row.ratingComment} />
        <ProjectPreviewLayout
          project={row as ProjectRow}
          showResourceLinks={shouldShowProjectResourceDownloadLinks(row.status)}
          includeExcludedAuthors
          titleRow={
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">{row.title}</h4>
              <StatusChip
                displayKey={getProjectStatusChipKey(row as ProjectRow)}
                status={row.status}
                ratingComment={row.ratingComment}
              />
              {row.published && <StatusChip displayKey="PUBLISHED" status={row.status} />}
            </div>
          }
        />
      </div>
    ),
    []
  );

  return (
    <div className={inSettingsLayout ? '' : 'max-w-screen-xl mx-auto'}>
      {!inSettingsLayout && <CommonPageHeader headline={t('headline')} />}

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <DropDownSelector
          variant="material"
          label={t('filter.program_label')}
          value={programFilter}
          options={programOptions}
          nullable
          nullableLabel={t('filter.all_programs')}
          onValueUpdated={handleProgramFilterChange}
          className="min-w-[14rem]"
        />
        <DropDownSelector
          variant="material"
          label={t('filter.course_group_label')}
          value={courseGroupFilter}
          options={courseGroupOptions}
          nullable
          nullableLabel={t('filter.all_course_groups')}
          onValueUpdated={handleCourseGroupFilterChange}
          className="min-w-[14rem]"
        />
      </div>

      <TableGrid<AdminProjectList_Project>
        columns={columns}
        data={projects}
        loading={loading}
        error={error}
        enablePagination={true}
        totalCount={totalCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={QUERY_LIMIT}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        refetchQueries={['AdminProjectList']}
        expandableRowComponent={expandableRowComponent}
        rounded
      />

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={successMessage}
        duration={4000}
      />
      <NotificationSnackbar
        open={showErrorNotification}
        onClose={() => setShowErrorNotification(false)}
        message={errorMessage}
        duration={6000}
      />
    </div>
  );
};

export default ManageProjectsContent;
