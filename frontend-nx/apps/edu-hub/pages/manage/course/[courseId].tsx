import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ManageCourseContent } from '../../../components/pages/ManageCourseContent';

const ManageCoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { status } = useSession();

  // Parse courseId only once it has been hydrated by the router
  const courseIdNumber = courseId ? Number(courseId) : null;

  // Keep ManageCourseContent mounted once authenticated — it handles its own
  // access-control check (admin vs. instructor-of-course). Gating on role here
  // caused mount/unmount cycles during session transitions that re-fired queries.
  if (status === 'loading' || !courseIdNumber || Number.isNaN(courseIdNumber)) {
    return (
      <>
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div>Waiting for authentication!</div>
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
      <Page>
        <ManageCourseContent courseId={courseIdNumber} />
      </Page>
    </>
  );
};

export default ManageCoursePage;
