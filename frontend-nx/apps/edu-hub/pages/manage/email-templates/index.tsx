import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import { useTranslations } from 'next-intl';

import ManageEmailTemplatesContent from '../../../components/pages/ManageEmailTemplatesContent';

const EmailTemplates: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const t = useTranslations('manageEmailTemplates');

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
              showBackButton={false}
            />
          )}
        </div>
      </Page>
    </>
  );
};

export default EmailTemplates;
