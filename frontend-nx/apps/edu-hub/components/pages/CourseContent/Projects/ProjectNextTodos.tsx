import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow, ProjectTypeRow } from './types';
import { PROJECT_FALLBACK_TITLE } from './projectDefaults';

interface TodoItem {
  id: string;
  satisfied: boolean;
  label: string;
}

interface ProjectNextTodosProps {
  project: ProjectRow;
  projectType: ProjectTypeRow | null | undefined;
  canEditProjectTitle: boolean;
  requestedJoinCount: number;
}

const ProjectNextTodos: FC<ProjectNextTodosProps> = ({
  project,
  projectType,
  canEditProjectTitle,
  requestedJoinCount,
}) => {
  const t = useTranslations('course');

  const items = useMemo<TodoItem[]>(() => {
    if (project.status === ProjectStatus_enum.PROPOSED) {
      const descOk = Boolean(project.description?.trim());
      const titleOk =
        !canEditProjectTitle ||
        (Boolean(project.title?.trim()) && project.title.trim() !== PROJECT_FALLBACK_TITLE);
      const teamOk =
        !project.acceptingParticipants || requestedJoinCount === 0;
      const reviewRequested = Boolean(project.projectReviewRequestedAt);
      return [
        {
          id: 'description',
          satisfied: descOk,
          label: t('projects.next_todos.proposed.description'),
        },
        ...(canEditProjectTitle
          ? [
              {
                id: 'title',
                satisfied: titleOk,
                label: t('projects.next_todos.proposed.title'),
              } as TodoItem,
            ]
          : []),
        ...(project.acceptingParticipants
          ? [
              {
                id: 'team',
                satisfied: teamOk,
                label: t('projects.next_todos.proposed.find_team'),
              } as TodoItem,
            ]
          : []),
        {
          id: 'project_review_request',
          satisfied: reviewRequested,
          label: t('projects.next_todos.proposed.project_review_request'),
        },
      ];
    }

    if (project.status === ProjectStatus_enum.ONGOING) {
      if (!projectType) {
        return [
          {
            id: 'type',
            satisfied: false,
            label: t('projects.checklist.type_required'),
          },
        ];
      }
      const authors = project.ProjectAuthors ?? [];
      const hasPendingJoinRequest = authors.some((a) => a.participationStatus === 'REQUESTED');
      const hasAcceptedAuthor = authors.some((a) => a.participationStatus === 'ACCEPTED');
      const allAuthorsAccepted = hasAcceptedAuthor && !hasPendingJoinRequest;

      const open: TodoItem[] = [];
      if (projectType.requiresDocumentation && !project.documentationUrl?.trim()) {
        open.push({
          id: 'documentation',
          satisfied: false,
          label: t('projects.next_todos.ongoing.documentation_upload'),
        });
      }
      if (projectType.requiresPresentation && !project.presentationUrl?.trim()) {
        open.push({
          id: 'presentation',
          satisfied: false,
          label: t('projects.next_todos.ongoing.presentation_upload'),
        });
      }
      if (projectType.requiresExternalUrl && !project.externalUrl?.trim()) {
        open.push({
          id: 'externalUrl',
          satisfied: false,
          label: t('projects.next_todos.ongoing.external_link'),
        });
      }
      if (projectType.requiresCoverImage && !project.coverImageUrl?.trim()) {
        open.push({
          id: 'coverImage',
          satisfied: false,
          label: t('projects.checklist.cover_image'),
        });
      }
      if (!allAuthorsAccepted) {
        open.push({
          id: 'authors',
          satisfied: false,
          label: t('projects.checklist.authors_accepted'),
        });
      }
      return open;
    }

    return [];
  }, [project, projectType, canEditProjectTitle, requestedJoinCount, t]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-label-secondary">{t('projects.next_todos.none_open')}</p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-center space-x-2 text-sm">
          {item.satisfied ? (
            <MdCheckCircle className="text-green-600 shrink-0" />
          ) : (
            <MdRadioButtonUnchecked className="text-label-secondary shrink-0" />
          )}
          <span
            className={item.satisfied ? 'text-label-primary' : 'text-label-secondary'}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ProjectNextTodos;
