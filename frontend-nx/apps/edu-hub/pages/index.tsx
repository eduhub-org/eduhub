import Head from 'next/head';
import { FC, useEffect, useState, Fragment } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Page } from '../components/Page';
import TileSlider from '../components/common/TileSlider';
import { useQuery } from '@apollo/client';
import { useAuthedQuery, useInstructorQuery } from '../hooks/authedQuery';
import { useIsLoggedIn, useIsInstructor, useIsAdmin, useIsSessionLoading } from '../hooks/authentication';
import { useUserId } from '../hooks/user';

import { CourseGroupOptions } from '../queries/__generated__/CourseGroupOptions';
import { CourseList } from '../queries/__generated__/CourseList';
import { CourseListWithEnrollments } from '../queries/__generated__/CourseListWithEnrollments';
import { CourseListWithInstructors } from '../queries/__generated__/CourseListWithInstructors';
import { COURSE_GROUP_OPTIONS } from '../queries/courseGroupOptions';
import { COURSE_LIST } from '../queries/courseList';
import { COURSE_LIST_WITH_ENROLLMENT } from '../queries/courseListWithEnrollments';
import { COURSE_LIST_WITH_INSTRUCTOR } from '../queries/courseListWithInstructors';

import { ClientOnly } from '@opencampus/shared-components';

import log from 'loglevel';
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  log.setLevel('warn'); // Show only warnings and errors in production.
} else {
  log.setLevel('debug'); // Show all log levels in development.
}

const Home: FC = () => {
  const { t } = useTranslation('start-page');
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const userId = useUserId();
  const isSessionLoading = useIsSessionLoading();
  const [myAdminCourses, setMyAdminCourses] = useState([]);

  const adminCoursesData = useInstructorQuery<CourseListWithInstructors>(COURSE_LIST_WITH_INSTRUCTOR, {
    skip: !isLoggedIn || !(isInstructor || isAdmin),
  });
  const enrolledCoursesData = useAuthedQuery<CourseListWithEnrollments>(COURSE_LIST_WITH_ENROLLMENT, {
    skip: !isLoggedIn,
  });
  const coursesData = useQuery<CourseList>(COURSE_LIST);
  const courseGroupOptionsData = useAuthedQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  const { data: adminCourses } = adminCoursesData;
  const { data: enrolledCourses } = enrolledCoursesData;
  const { data: courses } = coursesData;
  const { data: courseGroupOptions } = courseGroupOptionsData;

  useEffect(() => {
    if (!isSessionLoading && userId !== null && !adminCoursesData.loading && adminCoursesData?.data?.Course) {
      setMyAdminCourses(
        adminCourses?.Course?.filter((course) =>
          course.CourseInstructors.some((instructor) => instructor.Expert.User.id === userId)
        ) ?? []
      );
    }
  }, [
    isSessionLoading,
    adminCourses?.Course,
    userId,
    adminCoursesData.loading,
    adminCoursesData?.data?.Course,
    adminCoursesData,
    coursesData,
    courseGroupOptionsData,
  ]);

  const myCourses = (enrolledCourses?.Course ?? [])
    .filter(({ CourseEnrollments }) =>
      CourseEnrollments.some(({ userId: enrolledUserId }) => enrolledUserId === userId)
    )
    .sort((a, b) => {
      const dateA = new Date(a.applicationEnd).getTime();
      const dateB = new Date(b.applicationEnd).getTime();
      return dateB - dateA;
    });

  const publishedCourses = courses?.Course?.filter((course) => course.published && course.Program.published) ?? [];

  const coursesGroupsAuthenticated = [
    { title: 'myAdminCourses', courses: myAdminCourses, isManaged: true },
    { title: 'myCourses', courses: myCourses, isManaged: false },
  ];
  // log coursesGroupsAuthenticated to the console
  console.log('coursesGroupsAuthenticated: ', coursesGroupsAuthenticated);

  const coursesGroups = [1, 2, 3, 4, 5].map((order) => {
    const filteredCourses = publishedCourses.filter((course) =>
      course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.order === order)
    );
    const title = courseGroupOptions?.CourseGroupOption[order - 1]?.title;
    return {
      title,
      courses: filteredCourses,
    };
  });

  const renderCourseGroups = (groups, groupKey) => (
    <>
      {groups.map((group, index) =>
        group.courses.length > 0 ? (
          <Fragment key={`${groupKey}-${index}`}>
            <h2 id={`sliderGroup${index + 1}`} className="text-2xl font-semibold text-left ml-3 md:ml-0">
              {t(group.title)}
            </h2>
            <div className="mt-2 mb-12">
              <TileSlider courses={group.courses} isManage={group.isManaged ?? false} />
            </div>
          </Fragment>
        ) : null
      )}
    </>
  );

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
          <ClientOnly>
            {isLoggedIn && renderCourseGroups(coursesGroupsAuthenticated, 'coursesGroupsAuthenticated')}
            {renderCourseGroups(coursesGroups, 'coursesGroups')}
          </ClientOnly>
        </div>
      </Page>
    </>
  );
};

export default Home;
