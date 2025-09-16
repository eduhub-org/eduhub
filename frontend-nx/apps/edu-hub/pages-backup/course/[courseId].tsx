import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';
import CourseContent from '../../components/pages/CourseContent/index';
import { useIsSessionLoading } from '../../hooks/authentication';
import { CircularProgress } from '@mui/material';
import { withAuthRedirect } from '../../helpers/auth';

const getServerSidePropsWithRedirect = (redirectTo: string) => withAuthRedirect({ redirectTo })();

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirectTo = `${context.resolvedUrl}`;
  return getServerSidePropsWithRedirect(redirectTo)(context);
};

const CoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;

  const isSessionLoading = useIsSessionLoading();

  const id = parseInt(courseId as string, 10);

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
        <meta property="og:title" content="EduHub | opencampus.sh" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
      </Head>
      <Page>{isSessionLoading ? <CircularProgress /> : <CourseContent id={id} />}</Page>
    </>
  );
};

export default CoursePage;
