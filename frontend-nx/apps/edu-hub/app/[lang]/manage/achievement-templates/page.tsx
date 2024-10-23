'use client';

import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../../hooks/authentication';

import ManageAchievementTemplatesContent from '../../../../components/pages/ManageAchievementTemplatesContent';

const AchievementTemplates: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <ManageAchievementTemplatesContent />}</div>
      </Page>
    </>
  );
};

export default AchievementTemplates;
