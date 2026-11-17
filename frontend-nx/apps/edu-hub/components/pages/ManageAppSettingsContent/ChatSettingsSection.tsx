import { FC } from 'react';
import { useTranslations } from 'next-intl';

import CheckboxSelector from '../../inputs/CheckboxSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { APP_SETTINGS, UPDATE_APP_SETTINGS_MATRIX_CHAT } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';

/** Feature flag for the embedded Matrix course chat on course pages. */
const ChatSettingsSection: FC = () => {
  const t = useTranslations('manageAppSettings');

  const { data } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
  });

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary mb-4 block">
        {t('matrixChatSettings')}
      </label>
      <CheckboxSelector
        variant="material"
        label={t('matrixChatEnabled')}
        checked={data?.AppSettings[0]?.matrixChatEnabled ?? false}
        updateValueMutation={UPDATE_APP_SETTINGS_MATRIX_CHAT}
        identifierVariables={{ appName: 'edu' }}
        refetchQueries={['AppSettings']}
        className="text-label-primary"
      />
      <p className="mt-3 max-w-2xl text-sm text-label-secondary">{t('matrixChatHint')}</p>
    </div>
  );
};

export default ChatSettingsSection;
