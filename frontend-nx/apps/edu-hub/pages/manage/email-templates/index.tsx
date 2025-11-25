import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import useTranslation from 'next-translate/useTranslation';

import ManageEmailTemplatesContent from '../../../components/pages/ManageEmailTemplatesContent';

const EmailTemplates: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const { t } = useTranslation('manageEmailTemplates');

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
              explanatoryText={t('default_templates_explanation', {
                fallback: 'These are the default email templates used app-wide. You can also define course-specific templates in the manage courses view.',
              })}
              showBackButton={false}
            />
          )}
        </div>
      </Page>
    </>
  );
};

export default EmailTemplates;
