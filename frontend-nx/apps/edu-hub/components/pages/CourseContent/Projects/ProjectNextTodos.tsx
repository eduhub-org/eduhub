import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow, ProjectTypeRequirements } from './types';
import { PROJECT_FALLBACK_TITLE } from './projectDefaults';
import { safeProjectInstructionHref } from './projectMandatory';
import {
  getProjectSubmissionRequirements,
  ProjectSubmissionRequirement,
} from './SubmissionChecklist';
import { isOnlineCourseProject } from './projectStatusDisplay';

type TodoItem =
  | {
      id: string;
      kind: 'task';
      satisfied: boolean;
      label: string;
      embeddedLink?: { href: string; label: string };
      labelSuffix?: string;
    }

/** Translation key (under `projects.next_todos.ongoing`) per requirement. */
const ONGOING_TODO_I18N_KEY: Record<
  Exclude<ProjectSubmissionRequirement['key'], 'type'>,
  string
> = {
  documentation: 'documentation_upload',
  presentation: 'presentation_upload',
  externalUrl: 'external_link',
  coverImage: 'cover_image_upload',
  authorsPending: 'authors_pending',
  authorsNoneAccepted: 'authors_none_accepted',
};

interface ProjectNextTodosProps {
  project: ProjectRow;
  projectType: ProjectTypeRequirements | null | undefined;
  canEditProjectTitle: boolean;
  requestedJoinCount: number;
  isSubmissionDeadlinePassed?: boolean;
}

const ProjectNextTodos: FC<ProjectNextTodosProps> = ({
  project,
  projectType,
  canEditProjectTitle,
  requestedJoinCount,
  isSubmissionDeadlinePassed = false,
}) => {
  const t = useTranslations('course');

  const items = useMemo<TodoItem[]>(() => {
    const isOnlineCourse = isOnlineCourseProject(project);

    if (project.status === ProjectStatus_enum.PROPOSED) {
      const descOk = isOnlineCourse || Boolean(project.description?.trim());
      const titleOk =
        isOnlineCourse ||
        !canEditProjectTitle ||
        (Boolean(project.title?.trim()) && project.title.trim() !== PROJECT_FALLBACK_TITLE);
      const reviewRequested = Boolean(project.projectReviewRequestedAt);
      return [
        ...(!isOnlineCourse
          ? [
              {
                id: 'description',
                kind: 'task' as const,
                satisfied: descOk,
                label: t('projects.next_todos.proposed.description'),
              },
            ]
          : []),
        ...(!isOnlineCourse && canEditProjectTitle
          ? [
              {
                id: 'title',
                kind: 'task' as const,
                satisfied: titleOk,
                label: t('projects.next_todos.proposed.title'),
              },
            ]
          : []),
        ...(project.acceptingParticipants
          ? [
              {
                id: 'respond_join_requests',
                kind: 'task' as const,
                satisfied: requestedJoinCount === 0,
                label: t('projects.next_todos.proposed.respond_join_requests'),
              },
            ]
          : []),
        ...(!isSubmissionDeadlinePassed
          ? [
              {
                id: 'project_review_request',
                kind: 'task' as const,
                satisfied: reviewRequested,
                label: t('projects.next_todos.proposed.project_review_request'),
              },
            ]
          : []),
      ];
    }

    if (project.status === ProjectStatus_enum.ONGOING) {
      const instruction = project.ProjectDocumentationInstruction;
      const instructionHref = safeProjectInstructionHref(instruction?.url);

      // Derived from the same requirement list that gates the submit button, so
      // a blocker can never be missing from this checklist.
      return getProjectSubmissionRequirements(project, projectType).map(
        ({ key, satisfied }): TodoItem => {
          if (key === 'documentation' && instructionHref) {
            return {
              id: key,
              kind: 'task',
              satisfied,
              label: t('projects.next_todos.ongoing.documentation_upload_with_instruction_prefix'),
              labelSuffix: t('projects.next_todos.ongoing.documentation_upload_with_instruction_suffix'),
              embeddedLink: {
                href: instructionHref,
                label: t('projects.next_todos.ongoing.documentation_instruction_link'),
              },
            };
          }
          return {
            id: key,
            kind: 'task',
            satisfied,
            label:
              key === 'type'
                ? t('projects.checklist.type_required')
                : t(`projects.next_todos.ongoing.${ONGOING_TODO_I18N_KEY[key]}` as never),
          };
        }
      );
    }

    return [];
  }, [project, projectType, canEditProjectTitle, isSubmissionDeadlinePassed, requestedJoinCount, t]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-label-secondary">{t('projects.next_todos.none_open')}</p>
    );
  }

  const taskItems = items.filter((item): item is Extract<TodoItem, { kind: 'task' }> => item.kind === 'task');
  const hasOpenTasks = taskItems.some((item) => !item.satisfied);

  if (!hasOpenTasks) {
    return (
      <p className="text-sm text-label-secondary">{t('projects.next_todos.none_open')}</p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-sm text-label-primary">
          {item.satisfied ? (
            <MdCheckCircle className="text-green-600 shrink-0 mt-0.5" aria-hidden />
          ) : (
            <MdRadioButtonUnchecked className="text-label-secondary shrink-0 mt-0.5" aria-hidden />
          )}
          <span>
            {item.label}
            {item.embeddedLink ? (
              <>
                <a
                  href={item.embeddedLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline underline-offset-2 hover:opacity-90"
                >
                  {item.embeddedLink.label}
                </a>
                {item.labelSuffix ?? ''}
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ProjectNextTodos;
