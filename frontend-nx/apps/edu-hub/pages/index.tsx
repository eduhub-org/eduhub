import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { LoginButton } from '../components/LoginButton';
import { Page } from '../components/Page';
import { RegisterButton } from '../components/RegisterButton';
import { Button } from '../components/common/Button';
import { OnlyLoggedIn } from '../components/common/OnlyLoggedIn';
import { OnlyLoggedOut } from '../components/common/OnlyLoggedOut';
import { MyCourses } from '../components/course/MyCourses';
import { TileSlider } from '../components/course/TileSlider';
import { useQuery } from '@apollo/client';
import {
  useAuthedQuery,
  useAdminQuery,
  useInstructorQuery,
} from '../hooks/authedQuery';
import {
  useIsLoggedIn,
  useIsUser,
  useIsInstructor,
  useIsAdmin,
} from '../hooks/authentication';
import { CourseGroupOptions } from '../queries/__generated__/CourseGroupOptions';
import { CourseList } from '../queries/__generated__/CourseList';
import { CourseListWithEnrollments } from '../queries/__generated__/CourseListWithEnrollments';
import { CourseListWithInstructors } from '../queries/__generated__/CourseListWithInstructors';
import { COURSE_GROUP_OPTIONS } from '../queries/courseGroupOptions';
import { COURSE_LIST, COURSE_LIST_ANONYMOUS } from '../queries/courseList';
import { COURSE_LIST_WITH_ENROLLMENT } from '../queries/courseListWithEnrollments';
import { COURSE_LIST_WITH_INSTRUCTOR } from '../queries/courseListWithInstructors';
import { ClientOnly } from '@opencampus/shared-components';

const Home: FC = () => {
  const { t } = useTranslation('start-page');
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();

  // (My) Admin Courses
  const { data: adminCourses, error: adminCoursesError } =
    useInstructorQuery<CourseListWithInstructors>(COURSE_LIST_WITH_INSTRUCTOR, {
      skip: !isLoggedIn || !(isInstructor || isAdmin),
    });

  if (adminCoursesError) {
    console.log('got error in query for admin courses!', adminCoursesError);
  }
  console.log('Request Admin courses:', adminCourses);
  const myAdminCourses =
    adminCourses?.Course?.filter(
      (course) => course.CourseInstructors.length > 0
    ) ?? [];

  // (My) Enrolled Courses
  const { data: enrolledCourses, error: enrolledCoursesError } =
    useAuthedQuery<CourseListWithEnrollments>(COURSE_LIST_WITH_ENROLLMENT, {
      skip: !isLoggedIn,
    });
  if (enrolledCoursesError) {
    console.log(
      'got error in query for enrolled courses!',
      enrolledCoursesError
    );
  }
  const myCourses =
    enrolledCourses?.Course?.filter(
      (course) => course.CourseEnrollments.length > 0
    ) ?? [];

  // All Published Courses
  const { data: courses, error: coursesError } =
    useQuery<CourseList>(COURSE_LIST);
  if (coursesError) {
    console.log('got error in query for listed courses!', coursesError);
  }

  const publishedCourses =
    courses?.Course?.filter(
      (course) => course.published === true && course.Program.published === true
    ) ?? [];

  // Arrays with authenticatend and unauthenticated courses
  const coursesGroupsAuthenticated = [
    { title: t('myAdminCourses'), courses: myAdminCourses },
    { title: t('myCourses'), courses: myCourses },
  ];
  const { data: courseGroupOptions, error: courseGroupOptionError } =
    useAuthedQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);
  if (courseGroupOptionError) {
    console.log(
      'got error in query for course group info!',
      courseGroupOptionError
    );
  }
  const coursesGroups = [1, 2, 3, 4, 5].map((order) => {
    const courses = publishedCourses.filter((course) =>
      course.CourseGroups.some(
        (courseGroup) => courseGroup.CourseGroupOption.order === order
      )
    );
    const title = courseGroupOptions?.CourseGroupOption[order - 1].title;
    return {
      title,
      courses,
    };
  });

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <div
          className="h-[100vh] mb-11 md:mb-0"
          style={{
            background: `linear-gradient(360deg, #0F0F0F 0%, rgba(0, 0, 0, 0) 12.18%), linear-gradient(53.37deg, rgba(0, 0, 0, 0.8) 16.6%, rgba(0, 0, 0, 0) 79.45%), url('/images/background_homepage/1536.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
          }}
        >
          <div className="flex flex-col justify-end h-full max-w-screen-xl mx-auto px-3 md:px-16 py-48">
            <div className="text-6xl sm:text-9xl">{t('headline')}</div>
            <div className="text-xl sm:text-5xl mt-4">{t('subheadline')}</div>
          </div>
        </div>
        {/* <div className="max-w-screen-xl mx-auto md:mt-[-100px] md:pl-16"> */}
        <div className="max-w-screen-xl mx-auto md:mt-[-130px] md:pl-16 mt-[-180px]">
          <ClientOnly>
            {isLoggedIn && (
              <>
                {coursesGroupsAuthenticated.map((group, index) =>
                  group.courses.length > 0 ? (
                    <>
                      <h2
                        id={`sliderGroup${index + 1}`}
                        className="text-2xl font-semibold text-left ml-3 md:ml-0"
                      >
                        {t(group.title)}
                      </h2>
                      <div className="mt-2">
                        <TileSlider courses={group.courses} />
                      </div>
                    </>
                  ) : null
                )}
              </>
            )}
            {/* </OnlyLoggedIn> */}

            {/* ##################################################### */}
            {/* This Slider is only temporairly included for testing and must be removed later */}
            {/* <h2
              id={`allCourses`}
              className="text-2xl font-semibold text-left mt-20 ml-3 md:ml-0"
            >
              {'All Courses'}
            </h2>
            <div className="mt-2">
              <TileSlider courses={publishedCourses} />
            </div> */}
            {/* ##################################################### */}

            {coursesGroups.map((group, index) =>
              group.courses.length > 0 ? (
                <>
                  <h2
                    id={`sliderGroup${index + 3}`}
                    className="text-2xl font-semibold text-left ml-3 md:ml-0"
                  >
                    {t(group.title)}
                  </h2>
                  <div className="mt-2 mb-12">
                    <TileSlider courses={group.courses} />
                  </div>
                </>
              ) : null
            )}
            <OnlyLoggedOut>
              <div className="flex flex-col sm:flex-row mx-6 mt-6 mb-24 sm:mt-48">
                <div className="flex flex-1 flex-col sm:items-center">
                  <div>
                    <h2 className="text-3xl font-semibold">
                      {t('continueLearning')}
                    </h2>
                    <h3 className="text-lg">{t('learnSubheadline')}</h3>
                  </div>
                </div>
                <div className="flex flex-1 justify-center mt-8">
                  <div className="flex justify-center items-center space-x-3">
                    <LoginButton />
                    <RegisterButton />
                  </div>
                </div>
              </div>
            </OnlyLoggedOut>
          </ClientOnly>
        </div>
      </Page>
    </>
  );
};

export default Home;
