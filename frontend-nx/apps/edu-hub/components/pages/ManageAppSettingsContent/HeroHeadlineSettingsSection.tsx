import { FC, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import HeroHeadline from '../../common/HeroHeadline';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { APP_SETTINGS, UPDATE_APP_SETTINGS_HERO_HEADLINE } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';
import { UpdateHeroHeadline, UpdateHeroHeadlineVariables } from '../../../queries/__generated__/UpdateHeroHeadline';
import deMessages from '../../../locales/de.json';
import enMessages from '../../../locales/en.json';

type Inputs = {
  heroHeadlineDe: string;
  heroHeadlineEn: string;
};

// Each field falls back to its own language's built-in headline, independent of the admin's UI locale.
const LANGUAGES: { name: keyof Inputs; fallback: string }[] = [
  { name: 'heroHeadlineDe', fallback: deMessages.startPage.heroHeadline },
  { name: 'heroHeadlineEn', fallback: enMessages.startPage.heroHeadline },
];

const HeroHeadlineSettingsSection: FC = () => {
  const { data: sessionData } = useSession();
  const t = useTranslations('manageAppSettings');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<Inputs>({ defaultValues: { heroHeadlineDe: '', heroHeadlineEn: '' } });
  const {
    handleSubmit,
    register,
    watch,
    formState: { isSubmitting },
    reset,
  } = methods;

  const { refetch: refetchAppSettings } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
    onCompleted: (data) => {
      const [appSettings] = data.AppSettings;
      if (appSettings) {
        reset({
          heroHeadlineDe: appSettings.heroHeadlineDe ?? '',
          heroHeadlineEn: appSettings.heroHeadlineEn ?? '',
        });
      }
    },
    skip: !sessionData,
  });

  const [updateHeroHeadline] = useAdminMutation<UpdateHeroHeadline, UpdateHeroHeadlineVariables>(
    UPDATE_APP_SETTINGS_HERO_HEADLINE
  );

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateHeroHeadline({
        variables: {
          appName: 'edu',
          // An emptied field stores NULL so the homepage falls back to the built-in text.
          heroHeadlineDe: data.heroHeadlineDe.trim() || null,
          heroHeadlineEn: data.heroHeadlineEn.trim() || null,
        },
      });
      refetchAppSettings();
    } catch (error) {
      console.error('Failed to update hero headline:', error);
      setErrorMessage(t('errorSavingSettings'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-2 block">
        {t('heroHeadlineSettings')}
      </label>
      <p className="text-sm text-label-secondary mb-4">{t('heroHeadlineHint')}</p>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-wrap">
            {LANGUAGES.map(({ name, fallback }, i) => {
              // The preview shows exactly what the homepage would render, including the fallback.
              const preview = watch(name).trim() || fallback;
              return (
                <div key={name} className={`light w-1/2 ${i === 0 ? 'pr-3' : 'pl-3'}`}>
                  <label
                    htmlFor={name}
                    className="text-xs uppercase tracking-widest font-medium text-gray-400"
                  >
                    {t(name)}
                  </label>
                  <textarea
                    id={name}
                    rows={3}
                    placeholder={fallback}
                    {...register(name)}
                    className="bg-fill-primary text-label-primary p-4 mb-3 w-full block"
                  />
                  <div className="homepage-hero-tint p-4 mb-5">
                    <HeroHeadline markdown={preview} className="text-2xl" />
                  </div>
                </div>
              );
            })}
          </div>
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

export default HeroHeadlineSettingsSection;
