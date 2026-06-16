import { FC } from 'react';
import Head from 'next/head';
import { useTranslations } from 'next-intl';

import { Page } from '../../layout/Page';
import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
import SettingsLayout from './SettingsLayout';
import SettingsOverview from './SettingsOverview';

const ManageSettingsContent: FC = () => {
  const t = useTranslations('manageSettings');

  return (
    <>
      <Head>
        <title>{`EduHub | ${t('title')}`}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          <SettingsLayout>
            <SettingsOverview />
          </SettingsLayout>
        </div>
      </Page>
    </>
  );
};

const ManageSettings: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  if (!isAdmin && !isOrgAdmin) return null;
  return <ManageSettingsContent />;
};

export default ManageSettings;
