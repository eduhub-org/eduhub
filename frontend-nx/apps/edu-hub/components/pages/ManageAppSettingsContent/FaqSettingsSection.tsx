import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import CheckboxSelector from '../../inputs/CheckboxSelector';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import {
  APP_SETTINGS,
  FAQ_COLLECTIONS,
  UPDATE_APP_SETTINGS_FAQ_COLLECTION,
  UPDATE_APP_SETTINGS_FAQ_VISIBILITY,
} from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';
import { FaqCollections } from '../../../queries/__generated__/FaqCollections';

const FaqSettingsSection: FC = () => {
  const t = useTranslations('manageAppSettings');

  const { data: appSettingsData } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
  });

  const { data: faqCollectionsData } = useAdminQuery<FaqCollections>(FAQ_COLLECTIONS);

  const faqCollectionOptions = useMemo(
    () =>
      faqCollectionsData?.FaqCollection.map((collection) => ({
        value: collection.name,
        label: collection.name,
      })) ?? [],
    [faqCollectionsData]
  );

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-4 block">
        {t('faqSettings')}
      </label>
      <div className="mb-6">
        <CheckboxSelector
          variant="material"
          label={t('showFaqSection')}
          checked={appSettingsData?.AppSettings[0]?.showFaqSection ?? true}
          updateValueMutation={UPDATE_APP_SETTINGS_FAQ_VISIBILITY}
          identifierVariables={{ appName: 'edu' }}
          refetchQueries={['AppSettings']}
          className="text-label-primary"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-label-primary mb-3">{t('faqCollectionName')}</label>
        <DropDownSelector
          variant="material"
          options={faqCollectionOptions}
          value={appSettingsData?.AppSettings[0]?.faqCollectionName ?? 'default'}
          placeholder={t('faqCollectionPlaceholder')}
          updateValueMutation={UPDATE_APP_SETTINGS_FAQ_COLLECTION}
          identifierVariables={{ appName: 'edu' }}
          refetchQueries={['AppSettings']}
        />
      </div>
    </div>
  );
};

export default FaqSettingsSection;
