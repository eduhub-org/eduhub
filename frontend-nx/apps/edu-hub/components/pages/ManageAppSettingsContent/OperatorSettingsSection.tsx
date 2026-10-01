import { FC, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import FormFieldRow from '../../inputs/FormFieldRow';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { APP_SETTINGS, UPDATE_APP_SETTINGS_OPERATOR } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';
import { UpdateOperator, UpdateOperatorVariables } from '../../../queries/__generated__/UpdateOperator';

type Inputs = {
  operatorName: string;
  privacyContactEmail: string;
};

/**
 * Who operates this instance and where privacy incidents go. Both are optional
 * and used in user-facing texts such as the instructor confidentiality
 * commitment; empty values fall back to neutral wording.
 */
const OperatorSettingsSection: FC = () => {
  const { data: sessionData } = useSession();
  const t = useTranslations('manageAppSettings');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<Inputs>({ defaultValues: { operatorName: '', privacyContactEmail: '' } });
  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const { refetch } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
    onCompleted: (data) => {
      const [appSettings] = data.AppSettings;
      if (appSettings) {
        reset({
          operatorName: appSettings.operatorName ?? '',
          privacyContactEmail: appSettings.privacyContactEmail ?? '',
        });
      }
    },
    skip: !sessionData,
  });

  const [updateOperator] = useAdminMutation<UpdateOperator, UpdateOperatorVariables>(UPDATE_APP_SETTINGS_OPERATOR);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateOperator({
        variables: {
          appName: 'edu',
          operatorName: data.operatorName.trim() || null,
          privacyContactEmail: data.privacyContactEmail.trim() || null,
        },
      });
      refetch();
    } catch (error) {
      console.error('Failed to update operator settings:', error);
      setErrorMessage(t('errorSavingSettings'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-4 block">
        {t('operator.title')}
      </label>
      <p className="text-sm text-label-secondary mb-4">{t('operator.help')}</p>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormFieldRow<Inputs> label={t('operator.operatorName')} name="operatorName" placeholder="opencampus.sh" />
          <FormFieldRow<Inputs>
            label={t('operator.privacyContactEmail')}
            name="privacyContactEmail"
            type="email"
            placeholder="datenschutz@example.org"
          />
          <Button
            as="button"
            type="submit"
            disabled={isSubmitting}
            filled
            inverted
            className="mt-8 block mx-auto mb-5 disabled:opacity-50"
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </FormProvider>
      {errorMessage && (
        <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={() => setErrorMessage(null)} />
      )}
    </div>
  );
};

export default OperatorSettingsSection;
