// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import ManageCoursesContent from '../../../components/pages/ManageCoursesContent';
import { FC } from 'react';
import Loading from '../../../components/common/Loading';
import { Page } from '../../../components/layout/Page';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';

const Index: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <CoursesDashBoard />}</div>
      </Page>
    </>
  );
};

export default Index;

export const QUERY_LIMIT = 50;

const CoursesDashBoard: FC = () => {
  const programListRequest = useAdminQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES);

  if (programListRequest.error) {
    console.log(programListRequest.error);
  }
  if (programListRequest.loading) {
    return <Loading />;
  }

  const programs = [...(programListRequest?.data?.Program || [])];

  return programs.length > 0 ? (
    <div className="max-w-screen-xl mx-auto">
      <ManageCoursesContent programs={programs} />
    </div>
  ) : (
    <></>
  );
};
