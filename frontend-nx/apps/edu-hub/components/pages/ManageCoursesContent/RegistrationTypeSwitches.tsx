import { FC, useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useManageMutation } from '../../../hooks/authedMutation';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { UPDATE_COURSE_REGISTRATION_TYPE } from '../../../queries/course';
import { CourseRegistrationType_enum } from '../../../__generated__/globalTypes';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { RegistrationFlags, flagsToRegistrationType, registrationTypeToFlags } from './registrationFlags';

interface RegistrationTypeSwitchesProps {
  courseId: number;
  registrationType: CourseRegistrationType_enum | null;
}

/**
 * The registration type as independent on/off switches instead of one list of six combined
 * types. The switches are written back as the matching CourseRegistrationType value.
 */
const RegistrationTypeSwitches: FC<RegistrationTypeSwitchesProps> = ({ courseId, registrationType }) => {
  const t = useTranslations('manageCourses');
  const { error, handleError, resetError } = useErrorHandler();
  const flags = registrationTypeToFlags(registrationType);
  const currentType = flagsToRegistrationType(flags);

  // Each switch writes the whole registration type, derived from the stored one. Until the
  // refetched type arrives the switches are locked, so a quick second click cannot build on
  // stale flags and undo the first change.
  const [saving, setSaving] = useState(false);
  // State only updates after the next render; the ref closes the gap for a second click
  // that arrives before the switches are disabled.
  const savingRef = useRef(false);
  const [updateRegistrationType] = useManageMutation(UPDATE_COURSE_REGISTRATION_TYPE, {
    refetchQueries: ['AdminCourseList'],
    awaitRefetchQueries: true,
  });

  const setFlag = useCallback(
    async (flag: keyof RegistrationFlags, value: boolean) => {
      const nextType = flagsToRegistrationType({ ...flags, [flag]: value });
      if (savingRef.current || nextType === currentType) return;
      savingRef.current = true;
      setSaving(true);
      try {
        await updateRegistrationType({ variables: { itemId: courseId, value: nextType } });
      } catch (err) {
        handleError(err instanceof Error ? err.message : String(err));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [flags, currentType, courseId, updateRegistrationType, handleError]
  );

  const renderSwitch = (flag: keyof RegistrationFlags, checked: boolean, disabled = false) => (
    <div>
      <CheckboxSelector
        variant="switch"
        labelPlacement="end"
        label={t(`registration_switches.${flag}.label`)}
        checked={checked}
        disabled={disabled || saving}
        onValueUpdated={(value: boolean) => setFlag(flag, value)}
      />
      <p className="text-xs text-label-secondary -mt-2 ml-11">{t(`registration_switches.${flag}.help_text`)}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-label-primary">{t('registration_type.label')}</h4>
      {renderSwitch('external', flags.external)}
      {!flags.external && (
        <>
          {renderSwitch('application', flags.application)}
          {renderSwitch('questionnaire', flags.questionnaire, flags.application)}
          {renderSwitch('payment', flags.payment, flags.application)}
          {flags.application && (
            <p className="text-xs italic text-label-secondary">{t('registration_switches.application_locks_hint')}</p>
          )}
        </>
      )}
      <p className="text-sm text-label-primary pt-1">
        {t('registration_switches.summary', { mode: t(`registration_type.options.${currentType}`) })}
      </p>
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default RegistrationTypeSwitches;
