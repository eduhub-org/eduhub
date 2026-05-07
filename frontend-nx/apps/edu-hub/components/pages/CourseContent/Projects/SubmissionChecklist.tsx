import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { ProjectRow, ProjectTypeRow } from './types';

interface ChecklistItem {
  id: string;
  required: boolean;
  satisfied: boolean;
  label: string;
}

interface SubmissionChecklistProps {
  project: ProjectRow;
  projectType: ProjectTypeRow | null | undefined;
}

const SubmissionChecklist: FC<SubmissionChecklistProps> = ({ project, projectType }) => {
  const t = useTranslations('course');

  const items = useMemo<ChecklistItem[]>(() => {
    if (!projectType) {
      return [
        {
          id: 'type',
          required: true,
          satisfied: false,
          label: t('projects.checklist.type_required'),
        },
      ];
    }
    const allAuthorsAccepted =
      (project.ProjectAuthors ?? []).length > 0 &&
      (project.ProjectAuthors ?? []).every((a) => a.participationStatus === 'ACCEPTED');
    return [
      projectType.requiresDocumentation && {
        id: 'documentation',
        required: true,
        satisfied: Boolean(project.documentationUrl),
        label: t('projects.checklist.documentation'),
      },
      projectType.requiresPresentation && {
        id: 'presentation',
        required: true,
        satisfied: Boolean(project.presentationUrl),
        label: t('projects.checklist.presentation'),
      },
      projectType.requiresExternalUrl && {
        id: 'externalUrl',
        required: true,
        satisfied: Boolean(project.externalUrl),
        label: t('projects.checklist.external_url'),
      },
      projectType.requiresCoverImage && {
        id: 'coverImage',
        required: true,
        satisfied: Boolean(project.coverImageUrl),
        label: t('projects.checklist.cover_image'),
      },
      {
        id: 'authors',
        required: true,
        satisfied: allAuthorsAccepted,
        label: t('projects.checklist.authors_accepted'),
      },
    ].filter(Boolean) as ChecklistItem[];
  }, [project, projectType, t]);

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-center space-x-2 text-sm">
          {item.satisfied ? (
            <MdCheckCircle className="text-green-600" />
          ) : (
            <MdRadioButtonUnchecked className="text-label-secondary" />
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

export const isChecklistComplete = (
  project: ProjectRow,
  projectType: ProjectTypeRow | null | undefined
): boolean => {
  if (!projectType) return false;
  if (projectType.requiresDocumentation && !project.documentationUrl) return false;
  if (projectType.requiresPresentation && !project.presentationUrl) return false;
  if (projectType.requiresExternalUrl && !project.externalUrl) return false;
  if (projectType.requiresCoverImage && !project.coverImageUrl) return false;
  const authors = project.ProjectAuthors ?? [];
  if (authors.length === 0) return false;
  if (!authors.every((a) => a.participationStatus === 'ACCEPTED')) return false;
  return true;
};

export default SubmissionChecklist;
