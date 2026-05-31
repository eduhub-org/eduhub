import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ManageCourseContent } from '../../../components/pages/ManageCourseContent';
import Loading from '../../../components/common/Loading';
import { PageBlock } from '../../../components/common/PageBlock';

const ManageCoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { status } = useSession();

  // Parse courseId only once it has been hydrated by the router
  const courseIdNumber = courseId ? Number(courseId) : null;

  // Keep ManageCourseContent mounted only when authenticated — it handles its own
  // access-control check (admin vs. instructor-of-course). Blocking unauthenticated
  // prevents MANAGED_COURSE from firing and triggering auth-error behavior.
  if (status !== 'authenticated' || !courseIdNumber || Number.isNaN(courseIdNumber)) {
    return (
      <>
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page className="min-h-screen bg-bg-primary">
          <PageBlock>
            <div className="min-h-[50vh] flex items-center justify-center">
              <Loading />
            </div>
          </PageBlock>
        </Page>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="min-h-screen bg-bg-primary">
        <ManageCourseContent courseId={courseIdNumber} />
      </Page>
    </>
  );
};

export default ManageCoursePage;
