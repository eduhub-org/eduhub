import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import ManageEmailTemplatesContent from '../../../components/pages/ManageEmailTemplatesContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

const EmailSettings: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const t = useTranslations('manageEmailTemplates');

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <SettingsSectionPage itemId="emails" pageTitle={t('headline_default')}>
      <ManageEmailTemplatesContent
        courseId={undefined}
        explanatoryText={t('default_templates_explanation')}
        grouped
        inSettingsLayout
      />
    </SettingsSectionPage>
  );
};

export default EmailSettings;
