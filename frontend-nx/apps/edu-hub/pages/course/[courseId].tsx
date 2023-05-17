import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/Page';
import CoursePageContent from '../../components/course/CoursePageContent';
import { useIsSessionLoading } from '../../hooks/authentication';
import { CircularProgress } from '@material-ui/core';

// export const getStaticProps = async ({ locale }: { locale: string }) => ({
//   props: {
//     ...(await serverSideTranslations(locale, [
//       "common",
//       "course-page",
//       "course-application",
//     ])),
//   },
// });

// export const getStaticPaths = async () => {
//   return {
//     // Only `/posts/1` and `/posts/2` are generated at build time
//     paths: [{ params: { courseId: "1" } }, { params: { courseId: "2" } }],
//     // Enable statically generating additional pages
//     // For example: `/posts/3`
//     fallback: "blocking",
//   };
// };

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
        {isSessionLoading ? <CircularProgress /> : <CoursePageContent id={id} />}
      </Page>
    </>
  );
};

export default CoursePage;
