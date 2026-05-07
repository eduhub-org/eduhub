import { FC, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CircularProgress } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { MdAddCircle, MdClose } from 'react-icons/md';
import { useRoleQuery, useAuthedQuery } from '../../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useUserId } from '../../../../../hooks/user';
import TableGrid from '../../../../common/TableGrid';
import { Button } from '../../../../common/Button';
import NotificationSnackbar from '../../../../common/dialogs/NotificationSnackbar';
import { QuestionConfirmationDialog } from '../../../../common/dialogs/QuestionConfirmationDialog';
import { SelectUserDialog } from '../../../../common/dialogs/SelectUserDialog';
import { UserSelectionWithFilter_User } from '../../../../../queries/__generated__/UserSelectionWithFilter';
import {
  PROJECTS_BY_COURSE,
  PROJECT_TYPES,
  PROJECT_DOCUMENTATION_TEMPLATES,
  DELETE_PROJECT_AUTHOR,
} from '../../../../../queries/project';
import {
  INSTRUCTOR_INSERT_PROJECT_AUTHOR,
  INSERT_PROJECT_MENTOR,
  DELETE_PROJECT_MENTOR,
  UPDATE_PROJECT_PUBLISH,
} from '../../../../../queries/projectInstructor';
import {
  ProjectsByCourse,
  ProjectsByCourseVariables,
} from '../../../../../queries/__generated__/ProjectsByCourse';
import { ProjectTypes } from '../../../../../queries/__generated__/ProjectTypes';
import { ProjectDocumentationTemplates } from '../../../../../queries/__generated__/ProjectDocumentationTemplates';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../../__generated__/globalTypes';
import { formattedDateWithTime, makeFullName } from '../../../../../helpers/util';
import StatusChip from '../../../CourseContent/Projects/StatusChip';
import { ProjectRow } from '../../../CourseContent/Projects/types';
import ConfirmTeamDialog from './ConfirmTeamDialog';
import ReviewProjectDialog from './ReviewProjectDialog';
import AddProjectDialog from './AddProjectDialog';

interface ProjectsManagementGridProps {
  courseId: number;
  programDefaultProjectType: string | null;
}

const REFETCH_QUERIES = ['ProjectsByCourse'];

const STATUS_FILTER_VALUES: (ProjectStatus_enum | 'ALL')[] = [
  'ALL',
  ProjectStatus_enum.PROPOSED,
  ProjectStatus_enum.ONGOING,
  ProjectStatus_enum.SUBMITTED,
  ProjectStatus_enum.COMPLETED,
  ProjectStatus_enum.INCOMPLETE,
  ProjectStatus_enum.PUBLISHED,
];

const ProjectsManagementGrid: FC<ProjectsManagementGridProps> = ({
  courseId,
  programDefaultProjectType,
}) => {
  const t = useTranslations('manageCourse');
  const tCourse = useTranslations('course');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const instructorUserId = useUserId();

  const [statusFilter, setStatusFilter] = useState<(ProjectStatus_enum | 'ALL')>('ALL');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmTeamProject, setConfirmTeamProject] = useState<ProjectRow | null>(null);
  const [reviewProject, setReviewProject] = useState<ProjectRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectAuthorTarget, setSelectAuthorTarget] = useState<ProjectRow | null>(null);
  const [selectMentorTarget, setSelectMentorTarget] = useState<ProjectRow | null>(null);
  const [removeAuthorContext, setRemoveAuthorContext] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const projectsQuery = useRoleQuery<ProjectsByCourse, ProjectsByCourseVariables>(
    PROJECTS_BY_COURSE,
    { variables: { courseId } }
  );
  const projectTypesQuery = useAuthedQuery<ProjectTypes>(PROJECT_TYPES);
  const documentationTemplatesQuery = useAuthedQuery<ProjectDocumentationTemplates>(
    PROJECT_DOCUMENTATION_TEMPLATES
  );

  const [insertAuthor] = useRoleMutation(INSTRUCTOR_INSERT_PROJECT_AUTHOR, {
    refetchQueries: REFETCH_QUERIES,
  });
  const [deleteAuthor] = useRoleMutation(DELETE_PROJECT_AUTHOR, {
    refetchQueries: REFETCH_QUERIES,
  });
  const [insertMentor] = useRoleMutation(INSERT_PROJECT_MENTOR, {
    refetchQueries: REFETCH_QUERIES,
  });
  const [deleteMentor] = useRoleMutation(DELETE_PROJECT_MENTOR, {
    refetchQueries: REFETCH_QUERIES,
  });
  const [publishProject] = useRoleMutation(UPDATE_PROJECT_PUBLISH, {
    refetchQueries: REFETCH_QUERIES,
  });

  const filteredProjects = useMemo(() => {
    const projects = projectsQuery.data?.Project ?? [];
    return statusFilter === 'ALL'
      ? projects
      : projects.filter((p) => p.status === statusFilter);
  }, [projectsQuery.data?.Project, statusFilter]);

  const handleAuthorSelected = useCallback(
    async (
      confirmed: boolean,
      user: UserSelectionWithFilter_User | null
    ) => {
      const project = selectAuthorTarget;
      setSelectAuthorTarget(null);
      if (!confirmed || !user || !project) return;
      try {
        await insertAuthor({
          variables: {
            projectId: project.id,
            userId: user.id,
            participationStatus: ProjectParticipationStatus_enum.ACCEPTED,
          },
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [insertAuthor, selectAuthorTarget, tCommon]
  );

  const handleMentorSelected = useCallback(
    async (
      confirmed: boolean,
      user: UserSelectionWithFilter_User | null
    ) => {
      const project = selectMentorTarget;
      setSelectMentorTarget(null);
      if (!confirmed || !user || !project) return;
      try {
        await insertMentor({
          variables: { projectId: project.id, userId: user.id },
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [insertMentor, selectMentorTarget, tCommon]
  );

  const handleConfirmRemoveAuthor = useCallback(async () => {
    const ctx = removeAuthorContext;
    setRemoveAuthorContext(null);
    if (!ctx) return;
    try {
      await deleteAuthor({ variables: { id: ctx.id } });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [deleteAuthor, removeAuthorContext, tCommon]);

  const handleRemoveMentor = useCallback(
    async (id: number) => {
      try {
        await deleteMentor({ variables: { id } });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [deleteMentor, tCommon]
  );

  const handlePublish = useCallback(
    async (id: number) => {
      try {
        await publishProject({ variables: { itemId: id } });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [publishProject, tCommon]
  );

  const handleBulkAction = useCallback(
    async (action: string, rows: ProjectRow[]) => {
      if (action !== 'PUBLISH') return;
      const eligible = rows.filter((r) => r.status === ProjectStatus_enum.COMPLETED);
      if (eligible.length === 0) {
        setErrorMessage(t('projects.bulk.no_eligible'));
        return;
      }
      try {
        await Promise.all(
          eligible.map((row) =>
            publishProject({ variables: { itemId: row.id } })
          )
        );
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [publishProject, t, tCommon]
  );

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: 'title',
        header: t('projects.table.title'),
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{row.original.title}</span>
            <StatusChip status={row.original.status} />
          </div>
        ),
      },
      {
        id: 'authors',
        header: t('projects.table.authors'),
        cell: ({ row }) => {
          const accepted = (row.original.ProjectAuthors ?? []).filter(
            (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
          );
          if (accepted.length === 0) {
            return (
              <span className="text-label-secondary">
                {t('projects.table.no_authors')}
              </span>
            );
          }
          return (
            <span>
              {accepted
                .map((a) =>
                  makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')
                )
                .filter(Boolean)
                .join(', ')}
            </span>
          );
        },
      },
      {
        id: 'mentors',
        header: t('projects.table.mentors'),
        cell: ({ row }) => {
          const mentors = row.original.ProjectMentors ?? [];
          if (mentors.length === 0) {
            return <span className="text-label-secondary">-</span>;
          }
          return (
            <span>
              {mentors
                .map((m) =>
                  makeFullName(m.User?.firstName ?? '', m.User?.lastName ?? '')
                )
                .filter(Boolean)
                .join(', ')}
            </span>
          );
        },
      },
      {
        id: 'type',
        header: t('projects.table.type'),
        cell: ({ row }) =>
          row.original.type ? (
            <span>{tCourse(`projects.type_label.${row.original.type}` as never)}</span>
          ) : (
            <span className="text-label-secondary">-</span>
          ),
      },
      {
        id: 'updated_at',
        header: t('projects.table.last_update'),
        enableSorting: true,
        cell: ({ row }) =>
          row.original.updated_at ? (
            <span className="text-sm">
              {formattedDateWithTime(new Date(row.original.updated_at), locale)}
            </span>
          ) : (
            '-'
          ),
      },
      {
        id: 'action',
        header: '',
        cell: ({ row }) => {
          const project = row.original;
          if (project.status === ProjectStatus_enum.PROPOSED) {
            return (
              <Button onClick={() => setConfirmTeamProject(project)} className="w-full">
                {t('projects.actions.confirm_team')}
              </Button>
            );
          }
          if (project.status === ProjectStatus_enum.SUBMITTED) {
            return (
              <Button filled onClick={() => setReviewProject(project)} className="w-full">
                {t('projects.actions.review')}
              </Button>
            );
          }
          if (project.status === ProjectStatus_enum.COMPLETED) {
            return (
              <Button onClick={() => handlePublish(project.id)} className="w-full">
                {t('projects.actions.publish')}
              </Button>
            );
          }
          return null;
        },
      },
    ],
    [handlePublish, locale, t, tCourse]
  );

  const expandableRowComponent = useCallback(
    ({ row }: { row: ProjectRow }) => {
      const accepted = (row.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
      );
      const requested = (row.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
      );
      return (
        <div className="bg-fill-primary text-label-primary p-4 space-y-4 light">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              {row.tagline ? (
                <p>
                  <span className="font-medium">{t('projects.expanded.tagline')}: </span>
                  {row.tagline}
                </p>
              ) : null}
              {row.description ? (
                <p className="whitespace-pre-line">{row.description}</p>
              ) : null}
              {row.documentationUrl ? (
                <a
                  href={row.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-status-confirmed underline"
                >
                  {t('projects.expanded.documentation_link')}
                </a>
              ) : null}
              {row.presentationUrl ? (
                <a
                  href={row.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-status-confirmed underline"
                >
                  {t('projects.expanded.presentation_link')}
                </a>
              ) : null}
              {row.externalUrl ? (
                <a
                  href={row.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-status-confirmed underline"
                >
                  {t('projects.expanded.external_link')}
                </a>
              ) : null}
              {row.score != null ? (
                <p>
                  <span className="font-medium">{t('projects.expanded.score')}: </span>
                  {row.score}
                </p>
              ) : null}
              {row.rating ? (
                <p>
                  <span className="font-medium">{t('projects.expanded.rating')}: </span>
                  {row.rating}
                </p>
              ) : null}
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {t('projects.expanded.authors_heading')}
                  </span>
                  <Button onClick={() => setSelectAuthorTarget(row)}>
                    <MdAddCircle className="inline align-text-bottom" />{' '}
                    {t('projects.expanded.add_author')}
                  </Button>
                </div>
                <ul className="space-y-1">
                  {accepted.length === 0 ? (
                    <li className="text-sm text-label-secondary">
                      {t('projects.expanded.no_authors')}
                    </li>
                  ) : (
                    accepted.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')}
                        </span>
                        <button
                          type="button"
                          aria-label={t('projects.expanded.remove_author_aria')}
                          onClick={() =>
                            setRemoveAuthorContext({
                              id: a.id,
                              name: makeFullName(
                                a.User?.firstName ?? '',
                                a.User?.lastName ?? ''
                              ),
                            })
                          }
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <MdClose />
                        </button>
                      </li>
                    ))
                  )}
                  {requested.map((a) => (
                    <li key={a.id} className="text-sm text-label-secondary italic">
                      {makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')}{' '}
                      ({t('projects.expanded.requested')})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {t('projects.expanded.mentors_heading')}
                  </span>
                  <Button onClick={() => setSelectMentorTarget(row)}>
                    <MdAddCircle className="inline align-text-bottom" />{' '}
                    {t('projects.expanded.add_mentor')}
                  </Button>
                </div>
                <ul className="space-y-1">
                  {(row.ProjectMentors ?? []).length === 0 ? (
                    <li className="text-sm text-label-secondary">
                      {t('projects.expanded.no_mentors')}
                    </li>
                  ) : (
                    (row.ProjectMentors ?? []).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {makeFullName(m.User?.firstName ?? '', m.User?.lastName ?? '')}
                        </span>
                        <button
                          type="button"
                          aria-label={t('projects.expanded.remove_mentor_aria')}
                          onClick={() => handleRemoveMentor(m.id)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <MdClose />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [handleRemoveMentor, t]
  );

  const initialLoading = projectsQuery.loading && !projectsQuery.data;
  if (initialLoading) {
    return (
      <div className="flex justify-center py-6">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-label-secondary uppercase">
          {t('projects.filter_label')}
        </span>
        {STATUS_FILTER_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`px-2 py-1 rounded text-xs ${
              statusFilter === value
                ? 'bg-status-confirmed text-label-primary'
                : 'bg-bg-secondary text-label-secondary'
            }`}
          >
            {value === 'ALL'
              ? t('projects.filter_all')
              : tCourse(`projects.status.${value}` as never)}
          </button>
        ))}
      </div>

      <TableGrid<ProjectRow>
        columns={columns}
        data={filteredProjects}
        loading={projectsQuery.loading}
        error={projectsQuery.error}
        enablePagination={false}
        showGlobalSearchField={false}
        pageIndex={0}
        onPageChange={() => undefined}
        searchFilter=""
        onSearchFilterChange={() => undefined}
        refetchQueries={REFETCH_QUERIES}
        showCheckbox
        bulkActions={[
          {
            value: 'PUBLISH',
            label: t('projects.bulk.publish'),
            requiresSelection: true,
          },
        ]}
        onBulkAction={handleBulkAction}
        addButtonText={t('projects.add_button')}
        onAddButtonClick={() => setAddDialogOpen(true)}
        expandableRowComponent={expandableRowComponent}
      />

      <ConfirmTeamDialog
        open={Boolean(confirmTeamProject)}
        onClose={() => setConfirmTeamProject(null)}
        project={confirmTeamProject}
        projectTypes={projectTypesQuery.data?.ProjectType ?? []}
        documentationTemplates={
          documentationTemplatesQuery.data?.ProjectDocumentationTemplate ?? []
        }
        programDefaultProjectType={programDefaultProjectType}
        refetchQueries={REFETCH_QUERIES}
        onError={setErrorMessage}
      />

      <ReviewProjectDialog
        open={Boolean(reviewProject)}
        onClose={() => setReviewProject(null)}
        project={reviewProject}
        refetchQueries={REFETCH_QUERIES}
        onError={setErrorMessage}
      />

      {instructorUserId ? (
        <AddProjectDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          courseId={courseId}
          instructorUserId={instructorUserId}
          defaultProjectType={programDefaultProjectType}
          refetchQueries={REFETCH_QUERIES}
          onError={setErrorMessage}
        />
      ) : null}

      <SelectUserDialog
        open={Boolean(selectAuthorTarget)}
        title={t('projects.select_author_title')}
        onClose={handleAuthorSelected}
      />

      <SelectUserDialog
        open={Boolean(selectMentorTarget)}
        title={t('projects.select_mentor_title')}
        onClose={handleMentorSelected}
      />

      <QuestionConfirmationDialog
        open={Boolean(removeAuthorContext)}
        question={t('projects.remove_author_confirmation', {
          name: removeAuthorContext?.name ?? '',
        })}
        onClose={() => setRemoveAuthorContext(null)}
        onConfirm={handleConfirmRemoveAuthor}
      />

      <NotificationSnackbar
        open={Boolean(errorMessage)}
        onClose={() => setErrorMessage('')}
        message={errorMessage}
        duration={6000}
      />
    </div>
  );
};

export default ProjectsManagementGrid;
