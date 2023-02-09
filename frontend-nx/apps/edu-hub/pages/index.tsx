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
import { useAuthedQuery } from '../hooks/authedQuery';
import { useIsLoggedIn, useIsUser } from '../hooks/authentication';
import { CourseList } from '../queries/__generated__/CourseList';
import { CourseListWithEnrollments } from '../queries/__generated__/CourseListWithEnrollments';
import { CourseListWithInstructors } from '../queries/__generated__/CourseListWithInstructors';
import { COURSE_LIST } from '../queries/courseList';
import { COURSE_LIST_WITH_ENROLLMENT } from '../queries/courseListWithEnrollments';
import { COURSE_LIST_WITH_INSTRUCTOR } from '../queries/courseListWithInstructors';
import { ClientOnly } from '@opencampus/shared-components';
import { ApolloError } from '@apollo/client';
import { useSession } from 'next-auth/react';

const Home: FC = () => {
  const { t } = useTranslation('start-page');

  // Get Logged-In Status
  const useIsLoggedIn = (
    sessionData,
    status: 'authenticated' | 'loading' | 'unauthenticated'
  ): boolean => {
    return (status === 'authenticated' || false) && !!sessionData?.accessToken;
  };
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data, status } = useSession();
  const isLoggedIn = useIsLoggedIn(sessionData, status);
  useEffect(() => {
    setIsLoading(true);
    fetch('api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setSessionData(data);
        setIsLoading(false);
      });
  }, []);

  // (My) Administered Courses
  // TODO Adjust selection to courses with instruction - currently
  const [adminCourses, setAdminCourses] =
    useState<CourseListWithInstructors | null>(null);
  const [errorAdminCourses, setErrorAdminCourses] =
    useState<ApolloError | null>(null);
  const { data: adminCoursesQuery, error: errorAdminCoursesQuery } =
    useAuthedQuery<CourseListWithInstructors>(COURSE_LIST_WITH_INSTRUCTOR);
  useEffect(() => {
    if (
      isLoggedIn &&
      adminCoursesQuery &&
      !errorAdminCoursesQuery &&
      !isLoading
    ) {
      const fetchData = async () => {
        try {
          setAdminCourses(adminCoursesQuery);
        } catch (e) {
          setErrorAdminCourses(e);
        }
      };
      fetchData();
    }
  }, [isLoggedIn, adminCoursesQuery, errorAdminCoursesQuery, isLoading]);
  if (errorAdminCourses) {
    console.log('got error in query for enrolled courses!', errorAdminCourses);
  }
  const myAdminCourses =
    adminCourses?.Course?.filter(
      (course) => course.CourseInstructors.length > 0
    ) ?? [];

  // (My) Enrolled Courses
  const [enrolledCourses, setEnrolledCourses] =
    useState<CourseListWithEnrollments | null>(null);
  const [errorEnrolledCourses, setErrorEnrolledCourses] =
    useState<ApolloError | null>(null);
  const { data: enrolledCoursesQuery, error: errorEnrolledCoursesQuery } =
    useAuthedQuery<CourseListWithEnrollments>(COURSE_LIST_WITH_ENROLLMENT);
  useEffect(() => {
    if (
      isLoggedIn &&
      enrolledCoursesQuery &&
      !errorEnrolledCoursesQuery &&
      !isLoading
    ) {
      const fetchData = async () => {
        try {
          setEnrolledCourses(enrolledCoursesQuery);
        } catch (e) {
          setErrorEnrolledCourses(e);
        }
      };
      fetchData();
    }
  }, [isLoggedIn, enrolledCoursesQuery, errorEnrolledCoursesQuery, isLoading]);
  if (errorEnrolledCourses) {
    console.log(
      'got error in query for enrolled courses!',
      errorEnrolledCourses
    );
  }
  const myCourses =
    enrolledCourses?.Course?.filter(
      (course) => course.CourseEnrollments.length > 0
    ) ?? [];

  // All Published Courses
  const { data: courses, error: error_courses } =
    useAuthedQuery<CourseList>(COURSE_LIST);
  if (error_courses) {
    console.log('got error in query for listed courses!', error_courses);
  }
  const publishedCourses =
    courses?.Course?.filter(
      (course) => course.published === true && course.Program.published === true
    ) ?? [];

  // Filtering to Slider Groups
  const coursesSliderGroup1 = publishedCourses.filter((course) =>
    course.CourseGroups.some(
      (courseGroup) => courseGroup.CourseGroupOption.order === 1
    )
  );
  const coursesSliderGroup2 = publishedCourses.filter((course) =>
    course.CourseGroups.some(
      (courseGroup) => courseGroup.CourseGroupOption.order === 2
    )
  );
  const coursesSliderGroup3 = publishedCourses.filter((course) =>
    course.CourseGroups.some(
      (courseGroup) => courseGroup.CourseGroupOption.order === 3
    )
  );
  const coursesSliderGroup4 = publishedCourses.filter((course) =>
    course.CourseGroups.some(
      (courseGroup) => courseGroup.CourseGroupOption.order === 4
    )
  );
  const coursesSliderGroup5 = publishedCourses.filter((course) =>
    course.CourseGroups.some(
      (courseGroup) => courseGroup.CourseGroupOption.order === 5
    )
  );

  const coursesGroups = [
    { title: 'Course Administration', courses: myAdminCourses },
    { title: 'My Courses', courses: myCourses },
    { title: 'Tech & Coding', courses: coursesSliderGroup1 },
    { title: 'Business & Startup', courses: coursesSliderGroup2 },
    { title: 'Creative, Social & Sustainable', courses: coursesSliderGroup3 },
    { title: 'Degrees', courses: coursesSliderGroup4 },
    { title: 'Events', courses: coursesSliderGroup5 },
  ];

  return (
    <>
      <Head>
        <title>opencampus.sh Edu Hub</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="flex flex-col bg-[#F2991D] px-3">
          <span className="flex text-6xl sm:text-9xl mt-16 sm:mt-28">
            {t('headline')}
          </span>
          <div className="flex justify-center mt-4 mb-6 sm:mb-20">
            <span className="text-xl sm:text-5xl text-center">
              {t('subheadline')}
            </span>
          </div>
        </div>
        <ClientOnly>
          {/* <OnlyLoggedIn>
          </OnlyLoggedIn> */}

          {coursesGroups.map((group, index) =>
            group.courses.length > 0 ? (
              <>
                <h2
                  id={`sliderGroup${index + 1}`}
                  className="text-2xl font-semibold text-left mt-20"
                >
                  {t(group.title)}
                </h2>
                <div className="mt-2">
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
      </Page>
    </>
  );
};

export default Home;
