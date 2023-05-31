import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/Page';
import { useRouter } from 'next/router';
import { useIsInstructor } from '../../../hooks/authentication';
import { ManageCourseContent } from '../../../components/ManageCourseContent';

// export const getStaticProps = async ({ locale }: { locale: string }) => ({
//   props: {
//     ...(await serverSideTranslations(locale, [
//       "common",
//       "user-common",
//       "manage-course",
//     ])),
//   },
// });

// export const getStaticPaths = async () => {
//   return {
//     // Only `/1` and `/2` are generated at build time
//     paths: [{ params: { courseId: "1" } }, { params: { courseId: "2" } }],
//     // Enable statically generating additional pages
//     // For example: `/3`
//     fallback: "blocking",
//   };
// };

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
        {isInstructor ? (
          <ManageCourseContent courseId={Number(courseId)} />
        ) : (
          <div>Waiting for authentication!</div>
        )}
      </Page>
    </>
  );
};

export default ManageCoursePage;
