import { FC, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CircularProgress, Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { MdAddCircle, MdClose } from 'react-icons/md';
import { useRoleQuery } from '../../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { useUserId } from '../../../../../hooks/user';
import TableGrid from '../../../../common/TableGrid';
import { Button } from '../../../../common/Button';
import NotificationSnackbar from '../../../../common/dialogs/NotificationSnackbar';
import { QuestionConfirmationDialog } from '../../../../common/dialogs/QuestionConfirmationDialog';
import { SelectUserDialog } from '../../../../common/dialogs/SelectUserDialog';
import InputField from '../../../../inputs/InputField';
import DropDownSelector from '../../../../inputs/DropDownSelector';
import CheckboxSelector from '../../../../inputs/CheckboxSelector';
import FileUploadField from '../../../../inputs/FileUploadField';
import ProjectFormatSelector from '../../../CourseContent/Projects/ProjectFormatSelector';
import InstructionDownloadButton from '../../../CourseContent/Projects/InstructionDownloadButton';
import {
  PROJECT_REQUIREMENT_KEYS,
  REQUIREMENT_I18N_KEY,
  flagsOfProjectType,
} from '../../../CourseContent/Projects/projectTypeRequirements';
import { UserSelectionWithFilter_User } from '../../../../../queries/__generated__/UserSelectionWithFilter';
import { SAVE_PROJECT_IMAGE } from '../../../../../queries/actions';
import {
  PROJECTS_BY_COURSE,
  PROJECT_TYPES,
  PROJECT_DOCUMENTATION_INSTRUCTIONS,
  DELETE_PROJECT_AUTHOR,
  UPDATE_PROJECT_TITLE,
  UPDATE_PROJECT_TAGLINE,
  UPDATE_PROJECT_DESCRIPTION,
  UPDATE_PROJECT_COVER_IMAGE_URL,
  UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION,
  UPDATE_PROJECT_ACCEPTING_PARTICIPANTS,
} from '../../../../../queries/project';
import {
  INSTRUCTOR_INSERT_PROJECT_AUTHOR,
  INSERT_PROJECT_MENTOR,
  DELETE_PROJECT_MENTOR,
  DELETE_PROJECT,
  UPDATE_PROJECT_SUGGESTED_FOR_PUBLICATION,
  UPDATE_PROJECT_TYPE,
} from '../../../../../queries/projectInstructor';
import {
  ProjectsByCourse,
  ProjectsByCourseVariables,
} from '../../../../../queries/__generated__/ProjectsByCourse';
import { ProjectTypes } from '../../../../../queries/__generated__/ProjectTypes';
import { ProjectDocumentationInstructions } from '../../../../../queries/__generated__/ProjectDocumentationInstructions';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../../__generated__/globalTypes';
import { makeFullName } from '../../../../../helpers/util';
import {
  filterProjectDocumentationInstructionsWithPdf,
} from '../../../CourseContent/Projects/projectDocumentationInstruction';
import {
  getDisplayAuthors,
  isExcludedAuthor,
} from '../../../CourseContent/Projects/projectAuthors';
import { translateErrorMessage } from '../../../../../helpers/errorHandling';
import { PROJECT_TAGLINE_MAX_LENGTH } from '../../../CourseContent/Projects/projectDefaults';
import StatusChip from '../../../CourseContent/Projects/StatusChip';
import { isProjectTypeEditable, canManagePublicationSuggestion } from '../../../CourseContent/Projects/projectStatusDisplay';
import ProjectPreviewLayout from '../../../CourseContent/Projects/ProjectPreviewLayout';
import ProjectFormFieldSection from '../../../CourseContent/Projects/ProjectFormFieldSection';
import ProjectSubmissionDeadlineBelowTitle from '../../../CourseContent/Projects/ProjectSubmissionDeadlineBelowTitle';
import type { CourseProjectSubmissionDefaultSource } from '../../../CourseContent/Projects/projectEffectiveSubmissionDeadline';
import { ProjectRow } from '../../../CourseContent/Projects/types';
import ConfirmProjectDialog from './ConfirmProjectDialog';
import ReviewProjectDialog from './ReviewProjectDialog';
import AddProjectDialog from './AddProjectDialog';

interface ProjectsManagementGridProps {
  courseId: number;
  programDefaultProjectType: string | null;
  /** Course / program fallback when `Project.submissionDeadline` is null. */
  courseDefaultProjectSubmissionDeadline: string | null | undefined;
  courseSubmissionDeadlineDefaultSource: CourseProjectSubmissionDefaultSource;
}

const REFETCH_QUERIES = ['ProjectsByCourse'];

const ProjectsManagementGrid: FC<ProjectsManagementGridProps> = ({
  courseId,
  programDefaultProjectType,
  courseDefaultProjectSubmissionDeadline,
  courseSubmissionDeadlineDefaultSource,
}) => {
  const t = useTranslations('manageCourse');
  const tCourse = useTranslations('course');
  const tCommon = useTranslations('common');
  const instructorUserId = useUserId();

  const [errorMessage, setErrorMessage] = useState('');
  const [confirmProject, setConfirmProject] = useState<ProjectRow | null>(null);
  const [reviewProject, setReviewProject] = useState<ProjectRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectAuthorTarget, setSelectAuthorTarget] = useState<ProjectRow | null>(null);
  const [selectMentorTarget, setSelectMentorTarget] = useState<ProjectRow | null>(null);
  const [removeAuthorContext, setRemoveAuthorContext] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<ProjectRow | null>(null);

  const projectsQuery = useRoleQuery<ProjectsByCourse, ProjectsByCourseVariables>(
    PROJECTS_BY_COURSE,
    { variables: { courseId } }
  );
  const projectTypesQuery = useRoleQuery<ProjectTypes>(PROJECT_TYPES);
  const documentationInstructionsQuery = useRoleQuery<ProjectDocumentationInstructions>(
    PROJECT_DOCUMENTATION_INSTRUCTIONS
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
  const [updateSuggestedForPublication] = useRoleMutation(
    UPDATE_PROJECT_SUGGESTED_FOR_PUBLICATION,
    {
      refetchQueries: REFETCH_QUERIES,
    }
  );
  const [deleteProject, { loading: deleteProjectLoading }] = useRoleMutation(DELETE_PROJECT, {
    refetchQueries: REFETCH_QUERIES,
  });
  const [updateProjectType] = useRoleMutation(UPDATE_PROJECT_TYPE, {
    refetchQueries: REFETCH_QUERIES,
  });

  const allProjects = projectsQuery.data?.Project ?? [];

  // Most recently created project (the query is ordered by id asc) that has a
  // type set. New projects default to its type + documentation instruction so
  // an instructor doesn't re-pick the same setup for every project in a course.
  const lastTypedProject = useMemo(() => {
    const list = projectsQuery.data?.Project ?? [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].type) return list[i];
    }
    return null;
  }, [projectsQuery.data?.Project]);

  const blockedAuthorIds = useMemo(() => {
    const activeStatuses = new Set([
      ProjectStatus_enum.PROPOSED,
      ProjectStatus_enum.ONGOING,
      ProjectStatus_enum.SUBMITTED,
    ]);
    const ids = new Set<string>();
    for (const p of projectsQuery.data?.Project ?? []) {
      if (!activeStatuses.has(p.status)) continue;
      for (const a of p.ProjectAuthors ?? []) {
        if (
          a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED &&
          a.userId
        ) {
          ids.add(a.userId);
        }
      }
    }
    return ids;
  }, [projectsQuery.data?.Project]);

  /** Counts course projects whose parentProjectId points at a template (same course list). */
  const templateCopyCountByParentId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of projectsQuery.data?.Project ?? []) {
      if (p.parentProjectId != null) {
        const parentId = p.parentProjectId;
        counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
      }
    }
    return counts;
  }, [projectsQuery.data?.Project]);

  const projectTypesList = useMemo(
    () => projectTypesQuery.data?.ProjectType ?? [],
    [projectTypesQuery.data?.ProjectType]
  );

  const documentationInstructionsWithPdf = useMemo(
    () =>
      filterProjectDocumentationInstructionsWithPdf(
        documentationInstructionsQuery.data?.ProjectDocumentationInstruction ?? []
      ),
    [documentationInstructionsQuery.data?.ProjectDocumentationInstruction]
  );

  const handleCoverUploadError = useCallback(
    (error: string) => {
      const normalizedKey = error.toLowerCase().replaceAll('.', '_');
      const fileUploadKey = `file_upload.${normalizedKey}`;
      const direct = tCommon(fileUploadKey);
      setErrorMessage(
        direct !== fileUploadKey ? direct : translateErrorMessage(error, tCommon)
      );
    },
    [tCommon]
  );

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

  const handleConfirmDeleteTemplate = useCallback(async () => {
    const target = deleteTemplateTarget;
    setDeleteTemplateTarget(null);
    if (!target) return;
    try {
      await deleteProject({ variables: { id: target.id } });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [deleteProject, deleteTemplateTarget, tCommon]);

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

  const handleTogglePublicationSuggestion = useCallback(
    async (id: number, suggested: boolean) => {
      try {
        await updateSuggestedForPublication({
          variables: { itemId: id, suggested },
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [updateSuggestedForPublication, tCommon]
  );

  const handleSetProjectType = useCallback(
    async (projectId: number, value: string | null, status: ProjectStatus_enum) => {
      if (!isProjectTypeEditable(status)) return;
      // Skip persistence while the checked deliverables match no catalog type.
      if (!value) return;

      // Reset the instruction to the new type's default so type and
      // documentationInstructionId stay consistent (the DB trigger rejects a
      // mismatch). Mirrors the Add/Confirm dialog behaviour. Fall back to any
      // instruction of the new type when none is flagged as default.
      // Only instructions that actually carry a PDF are eligible: the mutation
      // would otherwise persist an ID the team cannot download.
      const instructions = documentationInstructionsWithPdf;
      const nextInstruction =
        instructions.find(
          (inst) => inst.projectTypeValue === value && inst.isDefault
        ) ?? instructions.find((inst) => inst.projectTypeValue === value);

      // Outside PROPOSED the database forbids a NULL documentationInstructionId
      // (Project_ongoing_requires_type_and_instruction_check), so refuse the
      // change with an actionable message instead of sending a mutation that
      // fails with a raw constraint error. Since only instructions with a PDF url
      // are eligible, "no instruction" also covers an admin-created row whose
      // upload is still pending.
      if (!nextInstruction && status !== ProjectStatus_enum.PROPOSED) {
        setErrorMessage(t('projects.expanded.type_change_no_instruction_error'));
        return;
      }

      try {
        await updateProjectType({
          variables: {
            itemId: projectId,
            value,
            documentationInstructionId: nextInstruction?.id ?? null,
          },
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [updateProjectType, documentationInstructionsWithPdf, t, tCommon]
  );

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: 'status',
        header: t('projects.table.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <StatusChip
            status={row.original.status}
            rating={row.original.rating}
            ratingComment={row.original.ratingComment}
            suggestedForPublication={row.original.suggestedForPublication}
          />
        ),
      },
      {
        id: 'title',
        header: t('projects.table.title'),
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-label-primary">{row.original.title}</span>
        ),
      },
      {
        id: 'authors',
        header: t('projects.table.authors'),
        cell: ({ row }) => {
          // Instructors/admins see EXCLUDED authors too, marked as excluded.
          const authors = getDisplayAuthors(row.original.ProjectAuthors, {
            includeExcluded: true,
          });
          if (authors.length === 0) {
            return (
              <span className="text-label-secondary">
                {t('projects.table.no_authors')}
              </span>
            );
          }
          return (
            <span>
              {authors
                .map((a) => {
                  const name = makeFullName(
                    a.User?.firstName ?? '',
                    a.User?.lastName ?? ''
                  );
                  if (!name) return '';
                  return isExcludedAuthor(a)
                    ? tCourse('projects.table.author_excluded_inline', { name })
                    : name;
                })
                .filter(Boolean)
                .join(', ')}
            </span>
          );
        },
      },
      {
        id: 'type',
        header: t('projects.table.type'),
        meta: { className: 'max-w-[14rem]' },
        cell: ({ row }) => {
          const typeValue = row.original.type;
          if (!typeValue) {
            return (
              <span className="text-label-secondary">
                {t('projects.type_select_placeholder')}
              </span>
            );
          }
          const projectType = projectTypesList.find((pt) => pt.value === typeValue);
          const deliverables = projectType
            ? PROJECT_REQUIREMENT_KEYS.filter((key) => flagsOfProjectType(projectType)[key]).map(
                (key) => t(`projects.requirements.${REQUIREMENT_I18N_KEY[key]}.short` as never)
              )
            : [];
          return (
            <Tooltip title={deliverables.join(', ')}>
              <div className="min-w-0">
                <span className="font-medium text-label-primary">
                  {tCourse(`projects.type_label.${typeValue}` as never)}
                </span>
                {deliverables.length > 0 ? (
                  <span className="block text-xs text-label-secondary truncate">
                    {deliverables.join(', ')}
                  </span>
                ) : null}
              </div>
            </Tooltip>
          );
        },
      },
      {
        id: 'action',
        header: '',
        cell: ({ row }) => {
          const project = row.original;
          if (project.status === ProjectStatus_enum.PROPOSED) {
            const hasAcceptedAuthor = (project.ProjectAuthors ?? []).some(
              (a) =>
                a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
            );
            if (!hasAcceptedAuthor) {
              const copyCount = templateCopyCountByParentId.get(project.id) ?? 0;
              const deleteDisabled = copyCount > 0 || deleteProjectLoading;
              const deleteButton = (
                <Button
                  className="w-full"
                  onClick={() => setDeleteTemplateTarget(project)}
                  disabled={deleteDisabled}
                >
                  {t('projects.actions.delete_template')}
                </Button>
              );
              return copyCount > 0 ? (
                <Tooltip title={t('projects.delete_template_disabled_tooltip')}>
                  <span className="block w-full">{deleteButton}</span>
                </Tooltip>
              ) : (
                deleteButton
              );
            }
            return (
              <Button onClick={() => setConfirmProject(project)} className="w-full">
                {t('projects.actions.confirm_project')}
              </Button>
            );
          }
          if (project.status === ProjectStatus_enum.ONGOING) {
            const evaluateBtn = (
              <Button disabled className="w-full">
                {t('projects.actions.evaluate_project')}
              </Button>
            );
            return (
              <Tooltip title={t('projects.actions.evaluate_disabled_tooltip')}>
                <span className="block w-full">{evaluateBtn}</span>
              </Tooltip>
            );
          }
          if (project.status === ProjectStatus_enum.SUBMITTED) {
            return (
              <Button filled onClick={() => setReviewProject(project)} className="w-full">
                {t('projects.actions.evaluate_project')}
              </Button>
            );
          }
          if (canManagePublicationSuggestion(project.status)) {
            if (project.suggestedForPublication) {
              return (
                <Button
                  onClick={() =>
                    handleTogglePublicationSuggestion(project.id, false)
                  }
                  className="w-full"
                >
                  {t('projects.actions.withdraw_publication_suggestion')}
                </Button>
              );
            }
            return (
              <Button
                onClick={() =>
                  handleTogglePublicationSuggestion(project.id, true)
                }
                className="w-full"
              >
                {t('projects.actions.suggest_for_publication')}
              </Button>
            );
          }
          return null;
        },
      },
    ],
    [
      deleteProjectLoading,
      handleTogglePublicationSuggestion,
      projectTypesList,
      t,
      tCourse,
      templateCopyCountByParentId,
    ]
  );

  const expandableRowComponent = useCallback(
    ({ row }: { row: ProjectRow }) => {
      const accepted = (row.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
      );
      const excluded = (row.ProjectAuthors ?? []).filter(isExcludedAuthor);
      const requested = (row.ProjectAuthors ?? []).filter(
        (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
      );
      const hasAcceptedAuthor = accepted.length > 0;

      const showFullDetails =
        row.status === ProjectStatus_enum.COMPLETED ||
        row.status === ProjectStatus_enum.PUBLISHED;
      const hasResourceUrl =
        Boolean(row.documentationUrl?.trim()) ||
        Boolean(row.presentationUrl?.trim()) ||
        Boolean(row.externalUrl?.trim());
      const showResourceLinks = showFullDetails || hasResourceUrl;
      const canEditProjectType = isProjectTypeEditable(row.status);

      const authorMentorSection = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-label-secondary">
                {t('projects.expanded.authors_heading')}
              </span>
              <Button onClick={() => setSelectAuthorTarget(row)}>
                <MdAddCircle className="inline align-text-bottom" />{' '}
                {t('projects.expanded.add_author')}
              </Button>
            </div>
            <ul className="space-y-1">
              {accepted.length === 0 && excluded.length === 0 ? (
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
              {excluded.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between text-sm opacity-60"
                >
                  <span>
                    {makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')}{' '}
                    <span className="italic text-label-secondary">
                      ({t('projects.expanded.excluded')})
                    </span>
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
              ))}
              {requested.map((a) => (
                <li key={a.id} className="text-sm text-label-secondary italic">
                  {makeFullName(a.User?.firstName ?? '', a.User?.lastName ?? '')}{' '}
                  ({t('projects.expanded.requested')})
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 md:border-l md:border-border-primary md:pl-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-label-secondary">
                  {t('projects.expanded.mentors_heading')}
                </span>
                <Tooltip title={t('projects.expanded.mentors_heading_tooltip')}>
                  <button
                    type="button"
                    className="inline-flex shrink-0 cursor-help rounded p-0.5 text-label-secondary border-0 bg-transparent hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={t('projects.expanded.mentors_heading_tooltip')}
                  >
                    <HelpOutline fontSize="small" />
                  </button>
                </Tooltip>
              </div>
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
      );

      // Sorted instruction options matching the Add/Confirm dialog presentation.
      const defaultSuffix = tCourse('projects.instruction_dropdown.default_suffix');
      const rowInstructionOptions = documentationInstructionsWithPdf
        .filter((inst) => !row.type || inst.projectTypeValue === row.type)
        .slice()
        .sort((a, b) => {
          if (a.isDefault === b.isDefault) return a.title.localeCompare(b.title);
          return a.isDefault ? -1 : 1;
        })
        .map((inst) => ({
          value: String(inst.id),
          label: inst.isDefault ? `${inst.title}${defaultSuffix}` : inst.title,
        }));

      const selectedInstructionUrl =
        documentationInstructionsWithPdf.find(
          (inst) => inst.id === row.documentationInstructionId
        )?.url ?? null;

      const documentationInstructionSection =
        rowInstructionOptions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
              {t('projects.add_dialog.instruction_label')}
            </p>
            <div className="flex items-center gap-2 [&_.col-span-10]:!mt-0">
              <div className="flex-1">
                <DropDownSelector
                  variant="material"
                  value={
                    row.documentationInstructionId
                      ? String(row.documentationInstructionId)
                      : ''
                  }
                  options={rowInstructionOptions}
                  updateValueMutation={UPDATE_PROJECT_DOCUMENTATION_INSTRUCTION}
                  identifierVariables={{ itemId: row.id }}
                  refetchQueries={REFETCH_QUERIES}
                  disabled={!canEditProjectType}
                />
              </div>
              <InstructionDownloadButton url={selectedInstructionUrl} />
            </div>
            <p className="mt-2 text-xs text-label-secondary whitespace-pre-line">
              {t('projects.add_dialog.instruction_info')}
            </p>
          </div>
        ) : null;

      const projectTypeSection = (
        <>
          <ProjectFormatSelector
            projectTypes={projectTypesList}
            value={row.type ?? ''}
            onChange={(typeValue) =>
              handleSetProjectType(row.id, typeValue, row.status)
            }
            disabled={!canEditProjectType}
          />
          {canEditProjectType && row.status === ProjectStatus_enum.ONGOING ? (
            // Files already uploaded under the old type are kept, but the set of
            // *mandatory* deliverables changes and the documentation instruction
            // is swapped for the new type's default, so warn before the team is
            // affected.
            <p className="mt-2 text-xs text-warning">
              {t('projects.expanded.type_change_ongoing_warning')}
            </p>
          ) : null}
          {!canEditProjectType ? (
            <p className="mt-2 text-xs text-label-secondary">
              {t('projects.expanded.type_locked_hint')}
            </p>
          ) : null}
        </>
      );

      if (!hasAcceptedAuthor) {
        const canEditProjectTitle = row.parentProjectId == null;
        return (
          <div className="bg-fill-primary text-label-primary p-4 space-y-6 light">
            {authorMentorSection}

            <div className="border-t border-border-primary pt-5 space-y-4">
              <ProjectSubmissionDeadlineBelowTitle
                mode="instructor"
                project={row}
                courseDefaultSubmissionDeadline={courseDefaultProjectSubmissionDeadline}
                defaultDeadlineSource={courseSubmissionDeadlineDefaultSource}
                refetchQueries={REFETCH_QUERIES}
              />
              <div className="rounded-lg border border-border-primary p-4 bg-bg-secondary/30 space-y-3">
                <ProjectPreviewLayout
                  project={row}
                  showResourceLinks={showResourceLinks}
                  includeExcludedAuthors
                  titleRow={
                    <div className="flex flex-wrap items-start gap-2 mb-1 w-full">
                      <div className="min-w-0 flex-1">
                        {canEditProjectTitle ? (
                          <InputField
                            variant="material"
                            type="input"
                            label={tCourse('projects.my_project.title_label')}
                            placeholder={tCourse('projects.my_project.title_label')}
                            itemId={row.id}
                            value={row.title}
                            updateValueMutation={UPDATE_PROJECT_TITLE}
                            refetchQueries={REFETCH_QUERIES}
                            helpText={tCourse('projects.my_project.field_tooltip_title')}
                            className="[&>div]:!mt-0 [&>div]:!mb-2"
                          />
                        ) : (
                          <div className="space-y-1">
                            <h4 className="text-xl font-semibold text-label-primary min-w-0 break-words">
                              {row.title}
                            </h4>
                            <p className="text-xs text-label-secondary">
                              {tCourse('projects.my_project.title_locked_hint')}
                            </p>
                          </div>
                        )}
                      </div>
                      <StatusChip
                        status={row.status}
                        rating={row.rating}
                        ratingComment={row.ratingComment}
                        suggestedForPublication={row.suggestedForPublication}
                      />
                    </div>
                  }
                  coverSlot={
                    <ProjectFormFieldSection
                      title={tCourse('projects.my_project.cover_image_section_label')}
                      tooltip={tCourse('projects.my_project.field_tooltip_cover_image')}
                    >
                    <FileUploadField
                      variant="material"
                      layout="stacked"
                      mutationPreset="role"
                      currentFileUrl={row.coverImageUrl}
                      uploadMutation={SAVE_PROJECT_IMAGE}
                      updateMutation={UPDATE_PROJECT_COVER_IMAGE_URL}
                      identifierVariables={{ itemId: row.id }}
                      uploadIdentifierVariables={{ projectId: row.id }}
                      updateFieldName="text"
                      acceptedFileTypes="image/*"
                      maxFileSize={5 * 1024 * 1024}
                      imageWidth={160}
                      imageHeight={96}
                      refetchQueries={REFETCH_QUERIES}
                      uploadText={tCourse('projects.my_project.cover_image_upload_text')}
                      altText={tCourse('projects.my_project.cover_image_alt')}
                      onUploadError={handleCoverUploadError}
                    />
                    </ProjectFormFieldSection>
                  }
                  taglineSlot={
                    <ProjectFormFieldSection
                      className="mt-3"
                      title={tCourse('projects.my_project.tagline_label')}
                      tooltip={tCourse('projects.my_project.field_tooltip_tagline')}
                    >
                      <div className="rounded border border-border-primary p-3 min-h-[3.5rem] text-sm bg-bg-secondary/50">
                        <InputField
                          variant="eduhub"
                          type="input"
                          placeholder={tCourse('projects.my_project.tagline_placeholder')}
                          itemId={row.id}
                          value={row.tagline ?? ''}
                          updateValueMutation={UPDATE_PROJECT_TAGLINE}
                          refetchQueries={REFETCH_QUERIES}
                          maxLength={PROJECT_TAGLINE_MAX_LENGTH}
                          showCharacterCount={false}
                          className="!mb-0 border-transparent bg-transparent [&>div]:!px-0"
                        />
                      </div>
                    </ProjectFormFieldSection>
                  }
                  descriptionSlot={
                    <ProjectFormFieldSection
                      className="flex flex-col flex-1 min-h-0"
                      title={tCourse('projects.my_project.description_label')}
                      tooltip={tCourse('projects.my_project.field_tooltip_description')}
                    >
                      <div className="rounded border border-border-primary p-3 flex-1 min-h-[10rem] text-sm bg-bg-secondary/50">
                        <InputField
                          variant="eduhub"
                          type="textarea"
                          placeholder={tCourse('projects.my_project.description_placeholder')}
                          itemId={row.id}
                          value={row.description ?? ''}
                          updateValueMutation={UPDATE_PROJECT_DESCRIPTION}
                          refetchQueries={REFETCH_QUERIES}
                          maxLength={8000}
                          showCharacterCount={false}
                          className="!mb-0 min-h-[9rem] border-transparent bg-transparent [&>div]:!px-0"
                        />
                      </div>
                    </ProjectFormFieldSection>
                  }
                />
                <CheckboxSelector
                  variant="material"
                  label={tCourse('projects.my_project.accepting_participants_label')}
                  checked={Boolean(row.acceptingParticipants)}
                  updateValueMutation={UPDATE_PROJECT_ACCEPTING_PARTICIPANTS}
                  identifierVariables={{ itemId: row.id }}
                  refetchQueries={REFETCH_QUERIES}
                  helpText={tCourse('projects.my_project.field_tooltip_accepting_participants')}
                />
              </div>
            </div>

            <div className="border-t border-border-primary pt-5">
              {projectTypeSection}
            </div>

            {documentationInstructionSection ? (
              <div className="border-t border-border-primary pt-5">
                {documentationInstructionSection}
              </div>
            ) : null}
          </div>
        );
      }

      return (
        <div className="bg-fill-primary text-label-primary p-4 space-y-6 light">
          {authorMentorSection}

          <div className="border-t border-border-primary pt-5 space-y-3">
            <ProjectSubmissionDeadlineBelowTitle
              mode="instructor"
              project={row}
              courseDefaultSubmissionDeadline={courseDefaultProjectSubmissionDeadline}
              defaultDeadlineSource={courseSubmissionDeadlineDefaultSource}
              refetchQueries={REFETCH_QUERIES}
            />
            <div className="rounded-lg border border-border-primary p-3 bg-bg-secondary/20">
              <ProjectPreviewLayout project={row} showResourceLinks={showResourceLinks} includeExcludedAuthors />
            </div>
          </div>

          <div className="border-t border-border-primary pt-5">
            {projectTypeSection}
          </div>

          {documentationInstructionSection ? (
            <div className="border-t border-border-primary pt-5">
              {documentationInstructionSection}
            </div>
          ) : null}
        </div>
      );
    },
    [
      documentationInstructionsWithPdf,
      handleCoverUploadError,
      handleRemoveMentor,
      handleSetProjectType,
      projectTypesList,
      courseDefaultProjectSubmissionDeadline,
      courseSubmissionDeadlineDefaultSource,
      t,
      tCourse,
    ]
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
      <TableGrid<ProjectRow>
        columns={columns}
        data={allProjects}
        loading={projectsQuery.loading}
        error={projectsQuery.error}
        enablePagination={false}
        showGlobalSearchField={false}
        pageIndex={0}
        onPageChange={() => undefined}
        searchFilter=""
        onSearchFilterChange={() => undefined}
        refetchQueries={REFETCH_QUERIES}
        addButtonText={t('projects.add_button')}
        onAddButtonClick={() => setAddDialogOpen(true)}
        expandableRowComponent={expandableRowComponent}
      />

      <ConfirmProjectDialog
        open={Boolean(confirmProject)}
        onClose={() => setConfirmProject(null)}
        project={confirmProject}
        projectTypes={projectTypesQuery.data?.ProjectType ?? []}
        documentationInstructions={
          documentationInstructionsQuery.data?.ProjectDocumentationInstruction ?? []
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
          defaultProjectType={lastTypedProject?.type ?? programDefaultProjectType}
          defaultDocumentationInstructionId={
            lastTypedProject?.documentationInstructionId ?? null
          }
          blockedAuthorIds={blockedAuthorIds}
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

      <QuestionConfirmationDialog
        open={Boolean(deleteTemplateTarget)}
        question={t('projects.delete_template_confirmation', {
          title: deleteTemplateTarget?.title ?? '',
        })}
        onClose={() => setDeleteTemplateTarget(null)}
        onConfirm={handleConfirmDeleteTemplate}
        confirmDisabled={deleteProjectLoading}
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
