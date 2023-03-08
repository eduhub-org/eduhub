import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { Page } from '../../components/Page';
import AuthorizedCoursePage from '../../components/course/AuthorizedCoursePage';
import UnauthorizedCoursePage from '../../components/course/UnauthorizedCoursePage';
import { useIsLoggedIn } from '../../hooks/authentication';
import { useIsAdmin, useIsInstructor } from '../../hooks/authentication';
import { isDataView } from 'util/types';

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
  const { courseId, tab: tabParam } = router.query;

  const isLoggedIn = useIsLoggedIn();

  const id = parseInt(courseId as string, 10);
  const defaultTab = isLoggedIn ? 1 : 0;
  const tab =
    typeof tabParam === 'string' ? parseInt(tabParam, 10) : defaultTab;

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        {isLoggedIn ? (
          <AuthorizedCoursePage id={id} tab={tab} />
        ) : (
          <UnauthorizedCoursePage id={id} />
        )}
      </Page>
    </>
  );
};

export default CoursePage;
