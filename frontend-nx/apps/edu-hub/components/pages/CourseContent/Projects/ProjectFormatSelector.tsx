import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import RadioSelector, { RadioSelectorOption } from '../../../inputs/RadioSelector';
import { ProjectTypeRow } from './types';
import {
  DEFAULT_CLASSIC_REQUIREMENT_FLAGS,
  ONLINE_COURSE_TYPE_VALUE,
  ProjectRequirementFlags,
  ProjectRequirementKey,
  REQUIREMENT_I18N_KEY,
  flagsOfProjectType,
  resolveClassicProjectType,
} from './projectTypeRequirements';

type ProjectFormat = 'classic' | 'online';

const PROJECT_FORMATS: ProjectFormat[] = ['classic', 'online'];

/**
 * Deliverables an instructor toggles for a classical project. The cover image
 * is intentionally omitted: it is always required for classical projects and is
 * therefore forced on during type resolution instead of being shown as a
 * checkbox.
 */
const CLASSIC_DELIVERABLE_KEYS: ProjectRequirementKey[] = [
  'requiresDocumentation',
  'requiresExternalUrl',
  'requiresPresentation',
];

interface ProjectFormatSelectorProps {
  projectTypes: ProjectTypeRow[];
  /** Currently selected project type value (`''` when none is chosen yet). */
  value: string;
  /** Receives the resolved type value, or null when the combination is invalid. */
  onChange: (typeValue: string | null) => void;
  /**
   * Whether the classical-vs-online format choice is offered. Set to false where
   * only classical projects are valid (e.g. confirming a student proposal, since
   * students cannot propose online courses); the format radios are then hidden
   * and only the classical "Erforderliche Abgaben" remain.
   */
  showFormatChoice?: boolean;
  disabled?: boolean;
  variant?: 'material' | 'eduhub';
  className?: string;
}

/**
 * Format-first project type picker for the "add project" dialog. The instructor
 * first chooses a project format (classical project vs. online course); the
 * "Erforderliche Abgaben" section below then adapts to that format:
 *
 * - Online course: a single, preselected and disabled "self-reflection
 *   questionnaire" deliverable (the online course's documentation requirement).
 * - Classical project: documentation / external link / presentation checkboxes.
 *   A cover image is always required (no checkbox) and the checked combination
 *   resolves to one of the cover-requiring catalog types.
 */
const ProjectFormatSelector: FC<ProjectFormatSelectorProps> = ({
  projectTypes,
  value,
  onChange,
  showFormatChoice = true,
  disabled = false,
  variant = 'material',
  className = '',
}) => {
  const t = useTranslations('manageCourse');

  // When the format choice is hidden only classical projects are valid, so the
  // online course is never selected even if the incoming value somehow is one.
  const isOnline = showFormatChoice && value === ONLINE_COURSE_TYPE_VALUE;
  const format: ProjectFormat = isOnline ? 'online' : 'classic';

  // Remembers the classical deliverable selection so switching to the online
  // course and back restores the previous classical choices.
  const [classicFlags, setClassicFlags] = useState<ProjectRequirementFlags>(
    () => ({ ...DEFAULT_CLASSIC_REQUIREMENT_FLAGS })
  );

  // Keep the classical memory in sync whenever a classical type is selected
  // externally (e.g. when the dialog seeds the carried-over type on open).
  useEffect(() => {
    if (!value || value === ONLINE_COURSE_TYPE_VALUE) return;
    const selected = projectTypes.find((pt) => pt.value === value);
    if (selected) setClassicFlags(flagsOfProjectType(selected));
  }, [value, projectTypes]);

  const resolvedClassicValue = useMemo(
    () =>
      resolveClassicProjectType(projectTypes, classicFlags, value ? [value] : [])
        ?.value ?? null,
    [projectTypes, classicFlags, value]
  );

  const handleFormatChange = (next: ProjectFormat) => {
    if (disabled || next === format) return;
    if (next === 'online') {
      onChange(ONLINE_COURSE_TYPE_VALUE);
    } else {
      onChange(resolvedClassicValue);
    }
  };

  const formatOptions: RadioSelectorOption[] = useMemo(
    () =>
      PROJECT_FORMATS.map((option) => ({
        value: option,
        label: t(`projects.requirements.format.${option}.label` as never),
        description: t(`projects.requirements.format.${option}.help` as never),
      })),
    [t]
  );

  const handleClassicToggle = (key: ProjectRequirementKey, checked: boolean) => {
    if (disabled) return;
    const next: ProjectRequirementFlags = { ...classicFlags, [key]: checked };
    setClassicFlags(next);
    const matched = resolveClassicProjectType(
      projectTypes,
      next,
      value ? [value] : []
    );
    onChange(matched ? matched.value : null);
  };

  const classicInvalid = format === 'classic' && resolvedClassicValue === null;

  return (
    <div className={className}>
      {showFormatChoice ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-label-secondary mb-2">
            {t('projects.requirements.format.label')}
          </p>
          <RadioSelector
            value={format}
            options={formatOptions}
            onValueChange={(next) => handleFormatChange(next as ProjectFormat)}
            disabled={disabled}
          />
        </>
      ) : null}

      <div
        className={`rounded-md border border-border-primary bg-bg-secondary p-3 ${
          showFormatChoice ? 'mt-3' : ''
        }`}
      >
        <p className="text-sm font-medium text-label-primary mb-2">
          {t('projects.requirements.section_label')}
        </p>

        {format === 'online' ? (
          <CheckboxSelector
            variant={variant}
            suppressFeedback
            disabled
            checked
            label={t('projects.requirements.self_reflection.label')}
            helpText={t('projects.requirements.self_reflection.help')}
            onValueUpdated={() => undefined}
          />
        ) : (
          <>
            <p className="text-xs text-label-secondary mb-2">
              {t('projects.requirements.section_help_classic')}
            </p>
            <div className="space-y-1">
              {CLASSIC_DELIVERABLE_KEYS.map((key) => (
                <CheckboxSelector
                  key={key}
                  variant={variant}
                  suppressFeedback
                  disabled={disabled}
                  checked={classicFlags[key]}
                  label={t(`projects.requirements.${REQUIREMENT_I18N_KEY[key]}.label` as never)}
                  helpText={t(`projects.requirements.${REQUIREMENT_I18N_KEY[key]}.help` as never)}
                  onValueUpdated={(checked: boolean) => handleClassicToggle(key, checked)}
                />
              ))}
              {/*
                The cover image is not a choice — it is forced on for every
                classical project by resolveClassicProjectType. It is listed
                here (checked and disabled) so the deliverables the instructor
                sees match the ones the team actually has to submit.
              */}
              <CheckboxSelector
                variant={variant}
                suppressFeedback
                disabled
                checked
                label={t('projects.requirements.requires_cover_image.label')}
                helpText={t('projects.requirements.requires_cover_image.help_always_required')}
                onValueUpdated={() => undefined}
              />
            </div>
            {classicInvalid ? (
              <p className="mt-2 text-xs text-error">
                {t('projects.requirements.classic_invalid_combination')}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectFormatSelector;
