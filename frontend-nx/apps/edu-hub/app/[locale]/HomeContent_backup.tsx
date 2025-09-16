'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@apollo/client';
import { Page } from '../../components/layout/Page';
import { COURSE_TILES } from '../../queries/courseQueries';
import { CourseTiles } from '../../queries/__generated__/CourseTiles';
import TileSlider from '../../components/common/TileSlider';
import { useIsLoggedIn, useIsInstructor, useIsAdmin } from '../../hooks/authentication';
import { useUserId } from '../../hooks/user';
import { useAuthedQuery, useInstructorQuery } from '../../hooks/authedQuery';
import { COURSES_BY_INSTRUCTOR, COURSES_ENROLLED_BY_USER } from '../../queries/courseQueries';
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

  // Debug GraphQL errors
  if (coursesError) {
    console.error('GraphQL Error:', coursesError);
  }

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

  // Debug other GraphQL errors
  if (adminCoursesError) {
    console.error('Admin Courses GraphQL Error:', adminCoursesError);
  }
  if (enrolledCoursesError) {
    console.error('Enrolled Courses GraphQL Error:', enrolledCoursesError);
  }

  const myAdminCourses = useMemo(() => adminCoursesData?.Course ?? [], [adminCoursesData]);
  const myCourses = useMemo(() => enrolledCoursesData?.Course ?? [], [enrolledCoursesData]);
  const publishedCourses = useMemo(() => coursesData?.Course ?? [], [coursesData]);

  const coursesGroupsAuthenticated = useMemo(
    () => [
      { title: 'my_admin_courses', courses: myAdminCourses, isManaged: true },
      { title: 'my_courses', courses: myCourses, isManaged: false },
    ],
    [myAdminCourses, myCourses]
  );

  const renderCourseGroups = (groups: any[], groupKey: string) => (
    <>
      {groups.map(
        (group, index) =>
          group.courses.length > 0 && (
            <Fragment key={`${groupKey}-${index}`}>
              <h2 id={`sliderGroup${index + 1}`} className="text-2xl font-semibold text-left ml-3 md:ml-0 mb-4">
                {tCommon(`course_group_options.${group.title}`)}
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
  const hasErrors = coursesError || adminCoursesError || enrolledCoursesError;
  
  return (
    <Page>
      <div className="flex flex-col">
        <div className="max-w-screen-xl mx-auto px-3 md:px-16 py-16">
          <h1 className="text-4xl font-bold mb-8">
            {t('welcome_title', { defaultValue: 'Welcome to EduHub' })}
          </h1>
          <p className="text-lg mb-8">
            {t('welcome_description', { 
              defaultValue: 'Your platform for educational courses and learning opportunities.' 
            })}
          </p>
          
          {/* Error state */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 p-8 rounded-lg shadow-md mb-8">
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
                </div>
              </details>
            </div>
          )}
          
          {/* Course content */}
          <div className="space-y-8">
            {isLoggedIn && !hasErrors && renderCourseGroups(coursesGroupsAuthenticated, 'authenticated')}
            
            {/* Public courses */}
            {!hasErrors && publishedCourses.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold text-left ml-3 md:ml-0 mb-4">
                  {tCommon('courses', { defaultValue: 'Courses' })}
                </h2>
                <div className="mt-2 mb-12">
                  <TileSlider courses={publishedCourses} isManage={false} />
                </div>
              </>
            )}
            
            {/* Loading state */}
            {isLoading && !hasErrors && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">
                  {tCommon('courses', { defaultValue: 'Courses' })}
                </h2>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            )}
            
            {/* No courses state */}
            {!isLoading && !hasErrors && publishedCourses.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">
                  {tCommon('courses', { defaultValue: 'Courses' })}
                </h2>
                <p className="text-gray-600">
                  {tCommon('no_courses_available', { defaultValue: 'No courses available at the moment.' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
