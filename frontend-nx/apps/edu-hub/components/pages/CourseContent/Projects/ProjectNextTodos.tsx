import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow, ProjectTypeRow } from './types';
import { PROJECT_FALLBACK_TITLE } from './projectDefaults';
import { isProjectResourceUrlPresent } from './projectMandatory';
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

interface ProjectNextTodosProps {
  project: ProjectRow;
  projectType: ProjectTypeRow | null | undefined;
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
      if (!projectType) {
        return [
          {
            id: 'type',
            kind: 'task',
            satisfied: false,
            label: t('projects.checklist.type_required'),
          },
        ];
      }

      const instruction = project.ProjectDocumentationInstruction;
      const instructionUrl = instruction?.url?.trim();

      const tasks: TodoItem[] = [];

      if (projectType.requiresDocumentation) {
        const docSatisfied = isProjectResourceUrlPresent(project.documentationUrl);
        if (instructionUrl) {
          tasks.push({
            id: 'documentation',
            kind: 'task',
            satisfied: docSatisfied,
            label: t('projects.next_todos.ongoing.documentation_upload_with_instruction_prefix'),
            labelSuffix: t('projects.next_todos.ongoing.documentation_upload_with_instruction_suffix'),
            embeddedLink: {
              href: instructionUrl,
              label: t('projects.next_todos.ongoing.documentation_instruction_link'),
            },
          });
        } else {
          tasks.push({
            id: 'documentation',
            kind: 'task',
            satisfied: docSatisfied,
            label: t('projects.next_todos.ongoing.documentation_upload'),
          });
        }
      }
      if (projectType.requiresPresentation) {
        tasks.push({
          id: 'presentation',
          kind: 'task',
          satisfied: isProjectResourceUrlPresent(project.presentationUrl),
          label: t('projects.next_todos.ongoing.presentation_upload'),
        });
      }
      if (projectType.requiresExternalUrl) {
        tasks.push({
          id: 'externalUrl',
          kind: 'task',
          satisfied: isProjectResourceUrlPresent(project.externalUrl),
          label: t('projects.next_todos.ongoing.external_link'),
        });
      }
      if (projectType.requiresCoverImage) {
        tasks.push({
          id: 'coverImage',
          kind: 'task',
          satisfied: Boolean(project.coverImageUrl?.trim()),
          label: t('projects.checklist.cover_image'),
        });
      }

      return tasks;
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
