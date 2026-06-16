import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../../hooks/authedMutation';
import { UPDATE_COURSE_PROJECT_PROPOSALS_ENABLED } from '../../../../../queries/course';
import NotificationSnackbar from '../../../../common/dialogs/NotificationSnackbar';

interface ProjectSetupCardProps {
  courseId: number;
  /** Course override; null means the program default applies. */
  proposalsEnabled: boolean | null;
  /** Program-wide default for project proposals. */
  programDefaultEnabled: boolean;
}

/**
 * Instructor- and admin-facing settings for how participants get a project in
 * this course. Frames the two (combinable) options explicitly: define precise
 * project templates with "Add project" below, and/or let participants propose
 * their own open projects (toggled here). Replaces the admin-only control that
 * previously lived on the Manage Courses page.
 */
const ProjectSetupCard: FC<ProjectSetupCardProps> = ({
  courseId,
  proposalsEnabled,
  programDefaultEnabled,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');
  const [errorMessage, setErrorMessage] = useState('');

  const [updateProposalsEnabled] = useRoleMutation(UPDATE_COURSE_PROJECT_PROPOSALS_ENABLED, {
    refetchQueries: ['ManagedCourse'],
  });

  const handleSetProposalsEnabled = useCallback(
    async (value: boolean | null) => {
      try {
        await updateProposalsEnabled({ variables: { itemId: courseId, value } });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tCommon('error'));
      }
    },
    [courseId, updateProposalsEnabled, tCommon]
  );

  // When the course has no explicit override yet, fall back to the program
  // default so one of the two options is always preselected.
  const effectiveEnabled = proposalsEnabled ?? programDefaultEnabled;

  const proposalOptions: {
    id: string;
    isActive: boolean;
    onClick: () => void;
    label: string;
  }[] = [
    {
      id: 'enabled',
      isActive: effectiveEnabled === true,
      onClick: () => handleSetProposalsEnabled(true),
      label: t('project_settings.proposals.option_enabled'),
    },
    {
      id: 'disabled',
      isActive: effectiveEnabled === false,
      onClick: () => handleSetProposalsEnabled(false),
      label: t('project_settings.proposals.option_disabled'),
    },
  ];

  return (
    <div className="rounded-lg border border-border-primary bg-bg-secondary/30 p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-label-primary">
          {t('project_settings.heading')}
        </h3>
        <p className="mt-1 text-sm text-label-secondary max-w-3xl">
          {t('project_settings.intro')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: predefined templates */}
        <div className="rounded-md border border-border-primary bg-fill-primary p-3 space-y-1">
          <p className="text-sm font-medium text-label-primary">
            {t('project_settings.option_templates.title')}
          </p>
          <p className="text-xs text-label-secondary">
            {t('project_settings.option_templates.help')}
          </p>
        </div>

        {/* Option 2: participant proposals */}
        <div className="rounded-md border border-border-primary bg-fill-primary p-3 space-y-2">
          <p className="text-sm font-medium text-label-primary">
            {t('project_settings.option_propose.title')}
          </p>
          <p className="text-xs text-label-secondary">
            {t('project_settings.option_propose.help')}
          </p>
          <div className="flex flex-col space-y-1 pt-1">
            {proposalOptions.map((option) => (
              <label
                key={option.id}
                className="inline-flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`project-proposals-${courseId}`}
                  className="cursor-pointer"
                  checked={option.isActive}
                  onChange={option.onClick}
                />
                <span className="text-sm text-label-primary">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <NotificationSnackbar
        open={Boolean(errorMessage)}
        onClose={() => setErrorMessage('')}
        message={errorMessage}
        duration={6000}
      />
    </div>
  );
};

export default ProjectSetupCard;
