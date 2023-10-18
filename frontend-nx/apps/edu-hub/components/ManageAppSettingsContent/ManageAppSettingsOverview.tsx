import { FC } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../common/Button';
import FormFieldRow from '../common/forms/FormFieldRow';

import { useAdminMutation } from '../../hooks/authedMutation';
import { useAdminQuery } from '../../hooks/authedQuery';

import { UpdateAppSettingsVariables, UpdateAppSettings } from '../../queries/__generated__/UpdateAppSettings';
import { APP_SETTINGS, UPDATE_APP_SETTINGS } from '../../queries/appSettings';
import { AppSettings } from '../../queries/__generated__/AppSettings';

type Inputs = {
  // backgroundImageURL: string;
  bannerBackgroundColor: string;
  bannerFontColor: string;
  bannerTextDe: string;
  bannerTextEn: string;
  // previewImageURL: string;
};

const ManageAppSettingsOverview: FC = () => {
  const { data: sessionData } = useSession();

  const methods = useForm<Inputs>({
    defaultValues: {
      // backgroundImageURL: '',
      bannerBackgroundColor: '',
      bannerFontColor: '',
      bannerTextDe: '',
      bannerTextEn: '',
      // previewImageURL: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const {
    data: appSettingsData,
    loading: appSettingsLoading,
    error: appSettingsError,
    refetch: refetchAppSettings,
  } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
    onCompleted: (data) => {
      const [appSettings] = data.AppSettings; // Using array destructuring to get the first item

      if (appSettings) {
        reset({
          // backgroundImageURL: appSettings.backgroundImageURL,
          bannerBackgroundColor: appSettings.bannerBackgroundColor,
          bannerFontColor: appSettings.bannerFontColor,
          bannerTextDe: appSettings.bannerTextDe,
          bannerTextEn: appSettings.bannerTextEn,
        });
      }
    },
    skip: !sessionData,
  });

  const [updateAppSettings] = useAdminMutation<UpdateAppSettings, UpdateAppSettingsVariables>(UPDATE_APP_SETTINGS);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateAppSettings({
        variables: {
          appName: 'edu',
          // backgroundImageURL: data.backgroundImageURL,
          bannerBackgroundColor: data.bannerBackgroundColor,
          bannerFontColor: data.bannerFontColor,
          bannerTextDe: data.bannerTextDe,
          bannerTextEn: data.bannerTextEn,
        },
      });

      refetchAppSettings();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(error);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="px-3 mt-32 max-w-screen-xl mx-auto">
      {!appSettingsLoading && !appSettingsError ? (
        <>
          <label className="text-xs uppercase tracking-widest font-medium text-gray-400">
            {t('manageAppSettings:appSettings')}
          </label>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-wrap">
                {/* <div className="w-1/2 pr-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:backgroundImageURL')}
                    name="backgroundImageURL"
                    required
                  />
                </div> */}
                <div className="w-1/2 pr-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:bannerBackgroundColor')}
                    name="bannerBackgroundColor"
                    placeholder="#ffffff"
                    required
                  />
                </div>
                <div className="w-1/2 pl-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:bannerFontColor')}
                    name="bannerFontColor"
                    placeholder="#ffffff"
                    required
                    className="w-1/2 pr-3"
                  />
                </div>
              </div>
              <div className="flex flex-wrap">
                <div className="w-1/2 pr-3">
                  <FormFieldRow<Inputs> label={t('manageAppSettings:bannerTextDe')} name="bannerTextDe" />
                </div>
                <div className="w-1/2 pl-3">
                  <FormFieldRow<Inputs> label={t('manageAppSettings:bannerTextEn')} name="bannerTextEn" />
                </div>
              </div>
              {/* <div className="flex flex-wrap">
                <div className="w-1/2 pl-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:previewImageURL')}
                    name="previewImageURL"
                  />
                </div>
              </div> */}
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
        </>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
};

export default ManageAppSettingsOverview;
