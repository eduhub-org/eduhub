import Head from 'next/head';
import { FC, Fragment, useMemo } from 'react';

import { useQuery } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import { ClientOnly } from '@opencampus/shared-components';

import { Page } from '../components/layout/Page';
import Loading from '../components/common/Loading';
import TileSlider from '../components/common/TileSlider';

import { useAuthedQuery, useInstructorQuery } from '../hooks/authedQuery';
import { useIsLoggedIn, useIsInstructor, useIsAdmin } from '../hooks/authentication';
import { useUserId } from '../hooks/user';

import { COURSE_GROUP_OPTIONS } from '../queries/courseGroupOptions';
import { COURSE_TILES, COURSES_BY_INSTRUCTOR, COURSES_ENROLLED_BY_USER } from '../queries/courseQueries';
import { CourseGroupOptions } from '../queries/__generated__/CourseGroupOptions';
import { CourseTiles } from '../queries/__generated__/CourseTiles';
import { CoursesByInstructor } from '../queries/__generated__/CoursesByInstructor';
import { CoursesEnrolledByUser } from '../queries/__generated__/CoursesEnrolledByUser';

const Home: FC = () => {
  const { t } = useTranslation('start-page');
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  const { data: adminCoursesData, loading: adminCoursesLoading } = useInstructorQuery<CoursesByInstructor>(COURSES_BY_INSTRUCTOR, {
    variables: { userId },
    skip: !isLoggedIn || !(isInstructor || isAdmin),
  });

  const { data: enrolledCoursesData, loading: enrolledCoursesLoading } = useAuthedQuery<CoursesEnrolledByUser>(COURSES_ENROLLED_BY_USER, {
    variables: { userId },
    skip: !isLoggedIn,
  });

  const { data: coursesData, loading: coursesLoading } = useQuery<CourseTiles>(COURSE_TILES);

  const { data: courseGroupOptionsData } = useAuthedQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

const myAdminCourses = useMemo(() => adminCoursesData?.Course ?? [], [adminCoursesData]);
const myCourses = useMemo(() => enrolledCoursesData?.Course ?? [], [enrolledCoursesData]);
const publishedCourses = useMemo(() => coursesData?.Course ?? [], [coursesData]);

  const coursesGroupsAuthenticated = useMemo(() => [
    { title: 'myAdminCourses', courses: myAdminCourses, isManaged: true },
    { title: 'myCourses', courses: myCourses, isManaged: false },
  ], [myAdminCourses, myCourses]);

  const coursesGroups = useMemo(() => [1, 2, 3, 4, 5].map((order) => {
    const filteredCourses = publishedCourses.filter((course) =>
      course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.order === order)
    );
    const title = courseGroupOptionsData?.CourseGroupOption[order - 1]?.title;
    return {
      title,
      courses: filteredCourses,
    };
  }), [publishedCourses, courseGroupOptionsData]);

  const renderCourseGroups = (groups, groupKey) => (
    <>
      {groups.map((group, index) =>
        group.courses.length > 0 && (
          <Fragment key={`${groupKey}-${index}`}>
            <h2 id={`sliderGroup${index + 1}`} className="text-2xl font-semibold text-left ml-3 md:ml-0">
              {t(group.title)}
            </h2>
            <div className="mt-2 mb-12">
              <TileSlider courses={group.courses} isManage={group.isManaged ?? false} />
            </div>
          </Fragment>
        )
      )}
    </>
  );

  const isLoading = adminCoursesLoading || enrolledCoursesLoading || coursesLoading;

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
        <meta property="og:title" content="EduHub | opencampus.sh" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
      </Head>
      <Page className="text-white">
        <div
          className="h-[100vh] mb-11 md:mb-0 bg-cover bg-top-center"
          style={{
            background: `linear-gradient(360deg, #0F0F0F 0%, rgba(0, 0, 0, 0) 12.18%), linear-gradient(53.37deg, rgba(0, 0, 0, 0.8) 16.6%, rgba(0, 0, 0, 0) 79.45%), url('/images/background_homepage/edu_WISE23_HeaderWebsite_small.png')`,
            backgroundSize: 'cover',
          }}
        >
          <div className="flex flex-col justify-end h-full max-w-screen-xl mx-auto px-3 md:px-16 py-48">
            <div className="text-6xl sm:text-9xl">{t('headline')}</div>
            <div className="text-6xl sm:text-9xl mt-4">{t('subheadline')}</div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto md:mt-[-130px] md:pl-16 mt-[-180px]">
          {isLoading ? (
            <Loading />
          ) : (
            <ClientOnly>
              {isLoggedIn && renderCourseGroups(coursesGroupsAuthenticated, 'coursesGroupsAuthenticated')}
              {renderCourseGroups(coursesGroups, 'coursesGroups')}
            </ClientOnly>
          )}
        </div>
      </Page>
    </>
  );
};

export default Home;
