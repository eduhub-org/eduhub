import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdLock } from 'react-icons/md';
import ProjectFormFieldSection from './ProjectFormFieldSection';
import { isProjectResourceUrlPresent } from './projectMandatory';

interface ProjectDeliverableReadOnlyFieldProps {
  /** DOM id of the section, so the blocked-submission dialog can scroll here. */
  id?: string;
  title: string;
  tooltip?: string;
  /** Stored value: a GCS object key for uploads, or the external URL. */
  value?: string | null;
  className?: string;
}

/** Last path segment of an upload key — the file name participants recognise. */
const displayValue = (value: string): string => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.split('/').pop() || trimmed;
};

/**
 * A deliverable shown after the submission deadline: the field stays visible
 * with its stored value, only the upload/edit controls are gone. Removing the
 * fields entirely (the previous behaviour) left participants with an empty
 * panel and no explanation of why they could no longer upload anything.
 */
const ProjectDeliverableReadOnlyField: FC<ProjectDeliverableReadOnlyFieldProps> = ({
  id,
  title,
  tooltip,
  value,
  className,
}) => {
  const t = useTranslations('course');
  const isPresent = isProjectResourceUrlPresent(value);

  return (
    <ProjectFormFieldSection id={id} title={title} tooltip={tooltip} className={className}>
      <div className="rounded border border-border-primary bg-bg-secondary/50 p-3 text-sm">
        <p className={isPresent ? 'text-label-primary break-all' : 'text-label-secondary'}>
          {isPresent
            ? displayValue(value as string)
            : t('projects.my_project.deliverable_missing_after_deadline')}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-label-secondary">
          <MdLock className="shrink-0" aria-hidden />
          {t('projects.my_project.deliverable_locked_after_deadline')}
        </p>
      </div>
    </ProjectFormFieldSection>
  );
};

export default ProjectDeliverableReadOnlyField;
