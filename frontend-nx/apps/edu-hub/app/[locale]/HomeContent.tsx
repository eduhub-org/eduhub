'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@apollo/client';
import { Page } from '../../components/layout/Page';
import { COURSE_TILES, COURSES_BY_INSTRUCTOR, COURSES_ENROLLED_BY_USER } from '../../queries/courseQueries';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { CourseTiles } from '../../queries/__generated__/CourseTiles';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';
import TileSlider from '../../components/common/TileSlider';
import { useIsLoggedIn, useIsInstructor, useIsAdmin } from '../../hooks/authentication';
import { useUserId } from '../../hooks/user';
import { useAuthedQuery, useInstructorQuery } from '../../hooks/authedQuery';
import { CoursesByInstructor } from '../../queries/__generated__/CoursesByInstructor';
import { CoursesEnrolledByUser } from '../../queries/__generated__/CoursesEnrolledByUser';
import { useMemo, Fragment } from 'react';

export function HomeContent() {
  const t = useTranslations('start-page');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  // Fetch courses data
  const { data: coursesData, loading: coursesLoading, error: coursesError } = useQuery<CourseTiles>(COURSE_TILES);

  // Fetch course group options
  const { data: courseGroupOptionsData, error: courseGroupOptionsError } = useQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  // Fetch user-specific courses if logged in
  const { data: adminCoursesData, loading: adminCoursesLoading, error: adminCoursesError } = useInstructorQuery<CoursesByInstructor>(
    COURSES_BY_INSTRUCTOR,
    {
      variables: { userId },
      skip: !isLoggedIn || !(isInstructor || isAdmin),
    }
  );

  const { data: enrolledCoursesData, loading: enrolledCoursesLoading, error: enrolledCoursesError } = useAuthedQuery<CoursesEnrolledByUser>(
    COURSES_ENROLLED_BY_USER,
    {
      variables: { userId },
      skip: !isLoggedIn,
    }
  );

  // Debug GraphQL errors
  if (coursesError) {
    console.error('GraphQL Error:', coursesError);
  }
  if (adminCoursesError) {
    console.error('Admin Courses GraphQL Error:', adminCoursesError);
  }
  if (enrolledCoursesError) {
    console.error('Enrolled Courses GraphQL Error:', enrolledCoursesError);
  }
  if (courseGroupOptionsError) {
    console.error('Course Group Options GraphQL Error:', courseGroupOptionsError);
  }

  const myAdminCourses = useMemo(() => adminCoursesData?.Course ?? [], [adminCoursesData]);
  const myCourses = useMemo(() => enrolledCoursesData?.Course ?? [], [enrolledCoursesData]);
  const publishedCourses = useMemo(() => coursesData?.Course ?? [], [coursesData]);

  // Course group options and published courses are working properly

  const coursesGroupsAuthenticated = useMemo(
    () => [
      { title: 'my_admin_courses', courses: myAdminCourses, isManaged: true },
      { title: 'my_courses', courses: myCourses, isManaged: false },
    ],
    [myAdminCourses, myCourses]
  );

  const coursesGroups = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((order) => {
        const filteredCourses = publishedCourses.filter((course) =>
          course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.order === order)
        );
        const title = courseGroupOptionsData?.CourseGroupOption[order - 1]?.title;
        return {
          title,
          courses: filteredCourses,
        };
      }),
    [publishedCourses, courseGroupOptionsData]
  );

  const renderCourseGroups = (groups: any[], groupKey: string) => (
    <>
      {groups.map(
        (group, index) =>
          group.courses.length > 0 && (
            <Fragment key={`${groupKey}-${index}`}>
              <h2 id={`sliderGroup${index + 1}`} className="text-2xl font-semibold text-left ml-3 md:ml-0 mb-4">
                {group.title ? tCommon(`course_group_options.${group.title}`) : `Course Group ${index + 1}`}
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
  const hasErrors = coursesError || adminCoursesError || enrolledCoursesError || courseGroupOptionsError;

  return (
    <Page className="text-white">
      {/* Hero Section with Background Image */}
      <div
        className="h-[100vh] mb-11 md:mb-0 bg-cover bg-top-center"
        style={{
          background: `linear-gradient(360deg, #0F0F0F 0%, rgba(0, 0, 0, 0) 12.18%), linear-gradient(53.37deg, rgba(0, 0, 0, 0.8) 16.6%, rgba(0, 0, 0, 0) 79.45%), url('/images/background_homepage/edu_WISE23_HeaderWebsite_small.png')`,
          backgroundSize: 'cover',
        }}
      >
        <div className="flex flex-col justify-end h-full max-w-screen-xl mx-auto px-3 md:px-16 py-48">
          <div className="text-6xl sm:text-9xl">{t('headline', { defaultValue: 'Updates für' })}</div>
          <div className="text-6xl sm:text-9xl mt-4">{t('subheadline', { defaultValue: 'deinen Weg' })}</div>
        </div>
      </div>
      
      {/* Course Content Section */}
      <div className="max-w-screen-xl mx-auto md:mt-[-130px] md:pl-16 mt-[-180px]">
        {/* Error state */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg shadow-md mb-8 mx-3 md:mx-0">
            <h2 className="text-2xl font-semibold mb-4 text-red-800">
              Connection Error
            </h2>
            <p className="text-red-700 mb-4">
              Unable to load course data. Please check if the backend services are running.
            </p>
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <div className="mt-2 space-y-2">
                {coursesError && <div>Courses: {coursesError.message}</div>}
                {adminCoursesError && <div>Admin Courses: {adminCoursesError.message}</div>}
                {enrolledCoursesError && <div>Enrolled Courses: {enrolledCoursesError.message}</div>}
                {courseGroupOptionsError && <div>Course Group Options: {courseGroupOptionsError.message}</div>}
              </div>
            </details>
          </div>
        )}
        
        {/* Course Groups */}
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-md mx-3 md:mx-0">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {tCommon('courses', { defaultValue: 'Courses' })}
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <>
            {/* User-specific course groups for logged in users */}
            {isLoggedIn && !hasErrors && renderCourseGroups(coursesGroupsAuthenticated, 'authenticated')}
            
            {/* Public course groups (Tech, Business, etc.) */}
            {!hasErrors && renderCourseGroups(coursesGroups, 'public')}
            
            {/* No courses state */}
            {!hasErrors && publishedCourses.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow-md mx-3 md:mx-0">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                  {tCommon('courses', { defaultValue: 'Courses' })}
                </h2>
                <p className="text-gray-600">
                  {tCommon('no_courses_available', { defaultValue: 'No courses available at the moment.' })}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
