import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { OnlyAdmin } from '../../../components/common/OnlyLoggedIn';

import ManageExpertsContent from '../../../components/pages/ManageExpertsContent';

const ManageExperts: FC = () => {
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
              <ManageExpertsContent />
            </OnlyAdmin>
          </div>
        </Page>
      </div>
    </>
  );
};

export default ManageExperts;

