import { FC } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import FormFieldRow from '../../inputs/FormFieldRow';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { UpdateBanner, UpdateBannerVariables } from '../../../queries/__generated__/UpdateBanner';
import { APP_SETTINGS, UPDATE_APP_SETTINGS_BANNER } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';

type Inputs = {
  bannerBackgroundColor: string;
  bannerFontColor: string;
  bannerTextDe: string;
  bannerTextEn: string;
};

const BannerSettingsSection: FC = () => {
  const { data: sessionData } = useSession();
  const t = useTranslations('manageAppSettings');

  const methods = useForm<Inputs>({
    defaultValues: {
      bannerBackgroundColor: '',
      bannerFontColor: '',
      bannerTextDe: '',
      bannerTextEn: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const { refetch: refetchAppSettings } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
    onCompleted: (data) => {
      const [appSettings] = data.AppSettings;
      if (appSettings) {
        reset({
          bannerBackgroundColor: appSettings.bannerBackgroundColor ?? undefined,
          bannerFontColor: appSettings.bannerFontColor ?? undefined,
          bannerTextDe: appSettings.bannerTextDe ?? undefined,
          bannerTextEn: appSettings.bannerTextEn ?? undefined,
        });
      }
    },
    skip: !sessionData,
  });

  const [updateBanner] = useAdminMutation<UpdateBanner, UpdateBannerVariables>(UPDATE_APP_SETTINGS_BANNER);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateBanner({
        variables: {
          appName: 'edu',
          bannerBackgroundColor: data.bannerBackgroundColor,
          bannerFontColor: data.bannerFontColor,
          bannerTextDe: data.bannerTextDe,
          bannerTextEn: data.bannerTextEn,
        },
      });
      refetchAppSettings();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update banner settings:', error);
      alert('An error occurred while saving the settings. Please try again.');
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400 mb-4 block">
        {t('bannerSettings')}
      </label>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-wrap">
            <div className="w-1/2 pr-3">
              <FormFieldRow<Inputs>
                label={t('bannerBackgroundColor')}
                name="bannerBackgroundColor"
                placeholder="#ffffff"
                required
              />
            </div>
            <div className="w-1/2 pl-3">
              <FormFieldRow<Inputs>
                label={t('bannerFontColor')}
                name="bannerFontColor"
                placeholder="#ffffff"
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap">
            <div className="w-1/2 pr-3">
              <FormFieldRow<Inputs> label={t('bannerTextDe')} name="bannerTextDe" />
            </div>
            <div className="w-1/2 pl-3">
              <FormFieldRow<Inputs> label={t('bannerTextEn')} name="bannerTextEn" />
            </div>
          </div>
          <Button
            as="button"
            type="submit"
            disabled={isSubmitting}
            filled
            inverted
            className="mt-8 block mx-auto mb-5 disabled:bg-slate-500"
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export default BannerSettingsSection;
