import Head from 'next/head';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import ManageEmailTemplatesContent from '../../../components/pages/ManageEmailTemplatesContent';

const EmailSettings: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const t = useTranslations('manageEmailTemplates');
  const tSettings = useTranslations('manageSettings');

  return (
    <>
      <Head>
        <title>EduHub | Email Templates</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {isLoggedIn && isAdmin && (
            <ManageEmailTemplatesContent
              courseId={undefined}
              explanatoryText={t('default_templates_explanation')}
              grouped
              showBackButton
              backHref="/manage/settings"
              backLabel={tSettings('back_to_settings')}
            />
          )}
        </div>
      </Page>
    </>
  );
};

export default EmailSettings;
