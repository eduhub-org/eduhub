import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/Page';
import CourseContent from '../../components/CourseContent/index';
import { useIsSessionLoading } from '../../hooks/authentication';
import { CircularProgress } from '@material-ui/core';

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
        <meta
          property="og:image"
          content="https://edu.opencampus.sh/images/meta-image.png"
        />
      </Head>
      <Page>
        {isSessionLoading ? (
          <CircularProgress />
        ) : (
          <CourseContent id={id} />
        )}
      </Page>
    </>
  );
};

export default CoursePage;
