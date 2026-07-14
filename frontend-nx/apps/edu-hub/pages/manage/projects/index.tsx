// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { OnlyAdmin } from '../../../components/common/OnlyLoggedIn';

import ManageProjectsContent from '../../../components/pages/ManageProjectsContent';

const ManageProjects: FC = () => {
  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="max-w-screen-xl mx-auto">
        <Page>
          <div className="min-h-[77vh]">
            <OnlyAdmin showFeedback={true}>
              <ManageProjectsContent />
            </OnlyAdmin>
          </div>
        </Page>
      </div>
    </>
  );
};

export default ManageProjects;
