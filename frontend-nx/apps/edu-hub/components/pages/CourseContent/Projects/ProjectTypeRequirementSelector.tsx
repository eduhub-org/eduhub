import { FC, useId, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { ProjectTypeRow } from './types';
import {
  ONLINE_COURSE_TYPE_VALUE,
  PROJECT_REQUIREMENT_KEYS,
  ProjectRequirementKey,
  flagsOfProjectType,
  getMatchingProjectTypes,
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
 *
 * When a combination is shared by several catalog types (e.g. ONLINE_COURSE and
 * CLASSIC_PROJECT both require documentation only) an extra format picker is
 * shown so the instructor can resolve the ambiguity; it defaults to the online
 * course, whose shortened proposal flow is described inline.
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
  const typeChoiceGroupName = useId();

  const currentType = useMemo(
    () => projectTypes.find((pt) => pt.value === value) ?? null,
    [projectTypes, value]
  );

  const requirements = useMemo(() => flagsOfProjectType(currentType), [currentType]);

  // Online course is the default whenever a documentation-only combination is
  // ambiguous, but an already-stored type still wins so editing stays stable.
  const preferredValues = useMemo(
    () =>
      [value, ONLINE_COURSE_TYPE_VALUE, programDefaultType].filter(
        Boolean
      ) as string[],
    [value, programDefaultType]
  );

  const handleToggle = (key: ProjectRequirementKey, checked: boolean) => {
    const next = { ...requirements, [key]: checked };
    const matched = resolveProjectTypeFromRequirements(projectTypes, next, preferredValues);
    onChange(matched ? matched.value : null);
  };

  const matchingTypes = useMemo(
    () => getMatchingProjectTypes(projectTypes, requirements),
    [projectTypes, requirements]
  );

  const isValid = Boolean(value && currentType);
  const isAmbiguous = isValid && matchingTypes.length > 1;

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

      {isAmbiguous ? (
        <div className="mt-3 rounded-md border border-border-primary p-3 bg-bg-secondary/40">
          <p className="text-sm font-medium text-label-primary">
            {t('projects.requirements.type_choice.label')}
          </p>
          <p className="text-xs text-label-secondary mb-2">
            {t('projects.requirements.type_choice.help')}
          </p>
          <div className="flex flex-col space-y-2">
            {matchingTypes.map((pt) => (
              <label
                key={pt.value}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={typeChoiceGroupName}
                  className="mt-1 cursor-pointer"
                  checked={pt.value === value}
                  disabled={disabled}
                  onChange={() => onChange(pt.value)}
                />
                <span className="text-sm">
                  <span className="font-medium text-label-primary">
                    {tCourse(`projects.type_label.${pt.value}` as never)}
                  </span>
                  <span className="block text-xs text-label-secondary">
                    {t(`projects.requirements.type_choice.descriptions.${pt.value}` as never)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {!isValid ? (
        <p className="mt-2 text-xs text-status-error">
          {t('projects.requirements.invalid_combination')}
        </p>
      ) : null}
    </div>
  );
};

export default ProjectTypeRequirementSelector;
