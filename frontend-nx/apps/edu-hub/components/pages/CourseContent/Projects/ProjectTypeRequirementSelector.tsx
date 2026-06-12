import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { ProjectTypeRow } from './types';
import {
  PROJECT_REQUIREMENT_KEYS,
  ProjectRequirementKey,
  flagsOfProjectType,
  resolveProjectTypeFromRequirements,
} from './projectTypeRequirements';

interface ProjectTypeRequirementSelectorProps {
  projectTypes: ProjectTypeRow[];
  /** Currently selected project type value (`''` when none is chosen yet). */
  value: string;
  /** Receives the resolved type value, or null when the combination is invalid. */
  onChange: (typeValue: string | null) => void;
  /** Tiebreak for combinations that several catalog types share. */
  programDefaultType?: string | null;
  disabled?: boolean;
  variant?: 'material' | 'eduhub';
  className?: string;
}

/**
 * Replaces the project-type dropdown with a checklist of submission
 * deliverables. The instructor checks what students must submit; the checked
 * combination is resolved back to one of the catalog project types (stored in
 * `Project.type`). Makes the mandatory deliverables explicit instead of hiding
 * them behind an opaque type name.
 */
const ProjectTypeRequirementSelector: FC<ProjectTypeRequirementSelectorProps> = ({
  projectTypes,
  value,
  onChange,
  programDefaultType,
  disabled = false,
  variant = 'material',
  className = '',
}) => {
  const t = useTranslations('manageCourse');
  const tCourse = useTranslations('course');

  const currentType = useMemo(
    () => projectTypes.find((pt) => pt.value === value) ?? null,
    [projectTypes, value]
  );

  const requirements = useMemo(() => flagsOfProjectType(currentType), [currentType]);

  const preferredValues = useMemo(
    () => [value, programDefaultType].filter(Boolean) as string[],
    [value, programDefaultType]
  );

  const handleToggle = (key: ProjectRequirementKey, checked: boolean) => {
    const next = { ...requirements, [key]: checked };
    const matched = resolveProjectTypeFromRequirements(projectTypes, next, preferredValues);
    onChange(matched ? matched.value : null);
  };

  const isValid = Boolean(value && currentType);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-label-primary mb-1">
        {t('projects.requirements.section_label')}
      </p>
      <p className="text-xs text-label-secondary mb-2">
        {t('projects.requirements.section_help')}
      </p>
      <div className="space-y-1">
        {PROJECT_REQUIREMENT_KEYS.map((key) => (
          <CheckboxSelector
            key={key}
            variant={variant}
            suppressFeedback
            disabled={disabled}
            checked={requirements[key]}
            label={t(`projects.requirements.${key}.label` as never)}
            helpText={t(`projects.requirements.${key}.help` as never)}
            onValueUpdated={(checked: boolean) => handleToggle(key, checked)}
          />
        ))}
      </div>

      {isValid ? (
        <p className="mt-2 text-xs text-label-secondary">
          <span className="font-medium text-label-primary">
            {t('projects.requirements.resolved_label')}:{' '}
          </span>
          {tCourse(`projects.type_label.${value}` as never)}
        </p>
      ) : (
        <p className="mt-2 text-xs text-status-error">
          {t('projects.requirements.invalid_combination')}
        </p>
      )}

      {projectTypes.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-medium text-label-primary">
            {t('projects.requirements.profiles_label')}
          </p>
          <ul className="mt-1 ml-4 space-y-1 text-xs text-label-secondary list-disc">
            {projectTypes.map((pt) => {
              const deliverables = PROJECT_REQUIREMENT_KEYS.filter(
                (key) => flagsOfProjectType(pt)[key]
              ).map((key) => t(`projects.requirements.${key}.short` as never));
              return (
                <li key={pt.value}>
                  <span className="font-medium text-label-primary">
                    {tCourse(`projects.type_label.${pt.value}` as never)}:
                  </span>{' '}
                  {deliverables.length > 0
                    ? deliverables.join(', ')
                    : t('projects.requirements.profiles_none')}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default ProjectTypeRequirementSelector;
