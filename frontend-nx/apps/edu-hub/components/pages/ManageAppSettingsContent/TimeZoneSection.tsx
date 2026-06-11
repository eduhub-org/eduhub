import { FC } from 'react';
import { useTranslations } from 'next-intl';

import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { APP_SETTINGS, UPDATE_APP_SETTINGS_TIME_ZONE } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';

const TimeZoneSection: FC = () => {
  const t = useTranslations('manageAppSettings');

  const timeZoneOptions = [
    { value: 'Europe/Berlin',      label: t('timeZones.Europe/Berlin') },
    { value: 'Europe/London',      label: t('timeZones.Europe/London') },
    { value: 'Europe/Paris',       label: t('timeZones.Europe/Paris') },
    { value: 'UTC',                label: t('timeZones.UTC') },
    { value: 'America/New_York',   label: t('timeZones.America/New_York') },
    { value: 'America/Los_Angeles',label: t('timeZones.America/Los_Angeles') },
    { value: 'Asia/Tokyo',         label: t('timeZones.Asia/Tokyo') },
  ];

  const { data: appSettingsData } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
  });

  return (
    <div className="mt-16">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400 mb-2 block">
        {t('timeZone')}
      </label>
      <DropDownSelector
        variant="material"
        options={timeZoneOptions}
        value={appSettingsData?.AppSettings[0]?.timeZone ?? ''}
        helpText={t('timeZoneHelpText')}
        updateValueMutation={UPDATE_APP_SETTINGS_TIME_ZONE}
        identifierVariables={{ appName: 'edu' }}
        refetchQueries={['AppSettings']}
      />
    </div>
  );
};

export default TimeZoneSection;
