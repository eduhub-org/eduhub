// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import ManageCoursesContent from '../../../components/pages/ManageCoursesContent';
import { FC } from 'react';
import Loading from '../../../components/common/Loading';
import { Page } from '../../../components/layout/Page';
import { useManageQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsLoggedIn, useIsOrgAdmin } from '../../../hooks/authentication';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';

const Index: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const isLoggedIn = useIsLoggedIn();
  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && (isAdmin || isOrgAdmin) && <CoursesDashBoard />}</div>
      </Page>
    </>
  );
};

export default Index;

export const QUERY_LIMIT = 50;

const CoursesDashBoard: FC = () => {
  // Org admins only see programs (and therefore courses) of organizations they administer; for
  // super-admins the where filter is empty. useManageQuery pins admin vs org_admin accordingly.
  const where = useManageProgramWhere();
  const programListRequest = useManageQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES, {
    variables: { where },
  });

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
