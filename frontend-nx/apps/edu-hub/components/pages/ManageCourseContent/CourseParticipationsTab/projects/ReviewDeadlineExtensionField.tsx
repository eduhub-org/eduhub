import { FC, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MdWarningAmber } from 'react-icons/md';
import RadioSelector, { RadioSelectorOption } from '../../../../inputs/RadioSelector';
import OptimisticDatePicker from '../../../../inputs/OptimisticDatePicker';
import {
  formatSubmissionDeadlineDate,
  submissionDeadlineToCalendarDate,
} from '../../../CourseContent/Projects/projectEffectiveSubmissionDeadline';
import {
  DeadlineExtensionChoice,
  getRelativeDeadline,
  isCustomDeadlineValid,
  toDateInputValue,
} from './reviewDeadlineExtension';

interface ReviewDeadlineExtensionFieldProps {
  choice: DeadlineExtensionChoice;
  onChoiceChange: (choice: DeadlineExtensionChoice) => void;
  /** `yyyy-mm-dd` from the custom date input. */
  customDate: string;
  onCustomDateChange: (value: string) => void;
  /** Effective deadline of the project (own override, else course/program default). */
  effectiveDeadlineIso: string | null;
  isDeadlinePassed: boolean;
  disabled?: boolean;
}

/**
 * Deadline handling offered while sending a project back for revision. A team
 * that has to rework its submission usually needs more time, and once the
 * deadline has passed it cannot resubmit at all — so the decision belongs right
 * here, next to the verdict, instead of in a separate step the instructor has to
 * remember.
 *
 * Nothing is written by this field: the parent persists the resolved date only
 * when the dialog is confirmed.
 */
const ReviewDeadlineExtensionField: FC<ReviewDeadlineExtensionFieldProps> = ({
  choice,
  onChoiceChange,
  customDate,
  onCustomDateChange,
  effectiveDeadlineIso,
  isDeadlinePassed,
  disabled = false,
}) => {
  const t = useTranslations('manageCourse');
  const locale = useLocale();

  const currentLabel = formatSubmissionDeadlineDate(effectiveDeadlineIso, locale);
  // Earliest selectable day — the calendar must not offer a deadline in the past.
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  // The parent keeps the custom date as `yyyy-mm-dd`; the picker works on Dates.
  const customDateValue = useMemo(
    () => submissionDeadlineToCalendarDate(customDate),
    [customDate]
  );

  const options = useMemo<RadioSelectorOption[]>(() => {
    const relativeOption = (key: 'plus_1_week' | 'plus_2_weeks'): RadioSelectorOption => ({
      value: key,
      label: t(`projects.evaluate_dialog.deadline.${key}` as never),
      description:
        formatSubmissionDeadlineDate(
          getRelativeDeadline(key, effectiveDeadlineIso),
          locale
        ) ?? undefined,
    });

    return [
      {
        value: 'keep',
        // Keeping a deadline that has passed is a dead end for the team, so it
        // is labelled as such rather than as the harmless default it is before.
        label: isDeadlinePassed
          ? t('projects.evaluate_dialog.deadline.keep_passed')
          : t('projects.evaluate_dialog.deadline.keep'),
        description: isDeadlinePassed
          ? t('projects.evaluate_dialog.deadline.keep_passed_description')
          : currentLabel ?? undefined,
      },
      relativeOption('plus_1_week'),
      relativeOption('plus_2_weeks'),
      {
        value: 'custom',
        label: t('projects.evaluate_dialog.deadline.custom'),
      },
    ];
  }, [t, locale, effectiveDeadlineIso, isDeadlinePassed, currentLabel]);

  const customInvalid = choice === 'custom' && customDate !== '' && !isCustomDeadlineValid(customDate);

  return (
    <div className="space-y-2 rounded-lg border border-border-primary bg-bg-secondary/40 p-3">
      <span className="block text-sm font-medium text-label-primary">
        {t('projects.evaluate_dialog.deadline.label')}
      </span>

      <p className="text-xs text-label-secondary">
        {currentLabel
          ? t('projects.evaluate_dialog.deadline.current', { date: currentLabel })
          : t('projects.evaluate_dialog.deadline.current_none')}
      </p>

      {isDeadlinePassed ? (
        <p className="flex items-start gap-1 text-xs text-error">
          <MdWarningAmber className="mt-0.5 shrink-0" aria-hidden />
          {t('projects.evaluate_dialog.deadline.passed_warning')}
        </p>
      ) : null}

      <RadioSelector
        value={choice}
        options={options}
        onValueChange={(value) => onChoiceChange(value as DeadlineExtensionChoice)}
        layout="inline"
        disabled={disabled}
      />

      {choice === 'custom' ? (
        <div>
          <span className="block text-xs text-label-secondary mb-1">
            {t('projects.evaluate_dialog.deadline.custom_label')}
          </span>
          {/* The app's standard date picker with its calendar popup, so a
              deadline is picked here the same way it is everywhere else. Used
              directly rather than through the mutation-bound `DatePicker`
              wrapper (as SessionsTab does): nothing may be written before the
              dialog is confirmed, the parent persists the resolved date. */}
          <div className="max-w-[14rem] light">
            <OptimisticDatePicker
              value={customDateValue}
              minDate={today}
              disabled={disabled}
              showWeekends
              className="w-full !bg-fill-primary !text-label-primary border border-border-primary rounded px-2 py-1.5 h-9"
              onChange={(date) =>
                onCustomDateChange(date ? toDateInputValue(date) : '')
              }
            />
          </div>
          {customInvalid ? (
            <span className="mt-1 block text-xs text-error">
              {t('projects.evaluate_dialog.deadline.custom_invalid')}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ReviewDeadlineExtensionField;
