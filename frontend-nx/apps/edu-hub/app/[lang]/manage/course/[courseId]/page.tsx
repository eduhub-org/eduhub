'use client';

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../../../components/layout/Page';
import { useRouter } from 'next/router';
import { useIsInstructor } from '../../../../../hooks/authentication';
import { ManageCourseContent } from '../../../../../components/pages/ManageCourseContent';

const ManageCoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const isInstructor = useIsInstructor();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        {isInstructor ? <ManageCourseContent courseId={Number(courseId)} /> : <div>Waiting for authentication!</div>}
      </Page>
    </>
  );
};

export default ManageCoursePage;
