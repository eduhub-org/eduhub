import Head from 'next/head';
import { FC, Fragment, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { useQuery } from '@apollo/client';
import { useTranslations, useLocale } from 'next-intl';
import { ClientOnly } from '@opencampus/shared-components';

import { Page } from '../components/layout/Page';
import Loading from '../components/common/Loading';
import TileSlider, { CourseType } from '../components/common/TileSlider';
import { Tile } from '../components/common/TileSlider/Tile';
import HomeProjectSlider from '../components/common/TileSlider/HomeProjectSlider';
import FaqSection from '../components/common/FaqSection';
import NotificationSnackbar from '../components/common/dialogs/NotificationSnackbar';

import { useAuthedQuery, useInstructorQuery } from '../hooks/authedQuery';
import { useIsLoggedIn, useIsInstructor, useIsAdmin } from '../hooks/authentication';
import { useUserId } from '../hooks/user';
import { AuthRoles } from '../types/enums';

import { COURSE_GROUP_OPTIONS } from '../queries/courseGroupOptions';
import { isKnownCourseGroupOptionTitle } from '../helpers/courseGroupOptions';
import { COURSE_TILES, COURSES_BY_INSTRUCTOR, COURSES_ENROLLED_BY_USER } from '../queries/courseQueries';
import { APP_SETTINGS } from '../queries/appSettings';
import { CourseGroupOptions } from '../queries/__generated__/CourseGroupOptions';
import { CourseTiles } from '../queries/__generated__/CourseTiles';
import { CoursesByInstructor } from '../queries/__generated__/CoursesByInstructor';
import { CoursesEnrolledByUser } from '../queries/__generated__/CoursesEnrolledByUser';
import { AppSettings } from '../queries/__generated__/AppSettings';

const Home: FC = () => {
  const t = useTranslations('startPage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();
  const userId = useUserId();
  
  const [showSessionExpiredNotification, setShowSessionExpiredNotification] = useState(false);

  // Check for session expired query parameter and show notification
  useEffect(() => {
    if (router.query.sessionExpired === 'true') {
      setShowSessionExpiredNotification(true);
      // Remove the query parameter from URL without reloading
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Extract to remove from query params
      const { sessionExpired: _sessionExpired, ...restQuery } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router]);

  const { data: adminCoursesData, loading: adminCoursesLoading } = useInstructorQuery<CoursesByInstructor>(
    COURSES_BY_INSTRUCTOR,
    {
      variables: { userId },
      skip: !isLoggedIn || !(isInstructor || isAdmin),
    }
  );

  const { data: enrolledCoursesData, loading: enrolledCoursesLoading } = useAuthedQuery<CoursesEnrolledByUser>(
    COURSES_ENROLLED_BY_USER,
    {
      variables: { userId },
      skip: !isLoggedIn,
    }
  );

  const { data: coursesData, loading: coursesLoading } = useQuery<CourseTiles>(COURSE_TILES, {
    context: { role: AuthRoles.anonymous },
  });

  const { data: courseGroupOptionsData } = useAuthedQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  const { data: appSettingsData } = useQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
  });

  const myAdminCourses = useMemo(() => adminCoursesData?.Course ?? [], [adminCoursesData]);
  const myCourses = useMemo(() => enrolledCoursesData?.Course ?? [], [enrolledCoursesData]);
  const publishedCourses = useMemo(
    () => (coursesData?.Course ?? []).filter((course) => course.published && course.Program.published),
    [coursesData]
  );

  const coursesGroupsAuthenticated = useMemo(
    () => [
      { title: 'my_admin_courses', courses: myAdminCourses, isManaged: true },
      { title: 'my_courses', courses: myCourses, isManaged: false },
    ],
    [myAdminCourses, myCourses]
  );

  // Ordered home sliders, interleaving course sliders and project sliders by the
  // shared CourseGroupOption "order". Organization-owned rows only appear in widgets.
  const homeSliders = useMemo(
    () =>
      (courseGroupOptionsData?.CourseGroupOption ?? [])
        .filter((option) => option.sliderGroup && option.organizationId == null)
        .map((option) => {
          if (option.contentType === 'PROJECT') {
            return { kind: 'project' as const, option };
          }
          const filteredCourses = option.programType
            ? // Program-type based groups (Courses, Events, Degrees) are populated
              // automatically from the published courses of that program type.
              publishedCourses.filter((course) => course.Program?.type === option.programType)
            : // Other groups still rely on manual CourseGroup assignments.
              publishedCourses.filter((course) =>
                course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.id === option.id)
              );
          return { kind: 'course' as const, id: option.id, title: option.title, courses: filteredCourses };
        }),
    [publishedCourses, courseGroupOptionsData]
  );

  // Translate known built-in CourseGroupOption titles; otherwise use the title verbatim.
  const sliderLabel = (title: string) =>
    isKnownCourseGroupOptionTitle(title) ? tCommon(`course_group_options.${title}`) : title;

  const renderHomeSliders = () => (
    <>
      {homeSliders.map((slider) => {
        if (slider.kind === 'project') {
          return (
            <HomeProjectSlider
              key={`home-project-${slider.option.id}`}
              option={slider.option}
              title={sliderLabel(slider.option.title)}
            />
          );
        }
        if (slider.courses.length === 0) return null;
        return (
          <Fragment key={`home-course-${slider.id}`}>
            <h2 id={`homeSliderGroup${slider.id}`} className="text-2xl font-semibold text-left ml-3 md:ml-0">
              {slider.title ? sliderLabel(slider.title) : '—'}
            </h2>
            <div className="mt-2 mb-12">
              <TileSlider
                items={slider.courses as CourseType[]}
                renderTile={(course) => <Tile course={course} isManage={false} />}
              />
            </div>
          </Fragment>
        );
      })}
    </>
  );

  const renderCourseGroups = (
    groups: Array<{ title?: string; courses: unknown[]; isManaged?: boolean }>,
    groupKey: string
  ) => (
    <>
      {groups.map(
        (group: { title?: string; courses: unknown[]; isManaged?: boolean }, index: number) =>
          group.courses.length > 0 && (
            <Fragment key={`${groupKey}-${index}`}>
              <h2 id={`sliderGroup${index + 1}`} className="text-2xl font-semibold text-left ml-3 md:ml-0">
                {group.title
                  ? isKnownCourseGroupOptionTitle(group.title)
                    ? tCommon(`course_group_options.${group.title}`)
                    : group.title
                  : '—'}
              </h2>
              <div className="mt-2 mb-12">
                <TileSlider
                  items={group.courses as CourseType[]}
                  renderTile={(course) => <Tile course={course} isManage={group.isManaged ?? false} />}
                />
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
        {/* Basic Meta Tags */}
        <title>EduHub | opencampus.sh</title>
        <meta name="description" content={t('seo.metaDescription')} />
        <meta name="keywords" content={t('seo.keywords')} />
        <meta name="author" content="opencampus.sh" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://edu.opencampus.sh" />
        <link rel="icon" href="/favicon.png" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="EduHub | opencampus.sh" />
        <meta property="og:description" content={t('seo.ogDescription')} />
        <meta property="og:url" content="https://edu.opencampus.sh" />
        <meta property="og:site_name" content="EduHub" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="EduHub Learning Platform - Tech, Business and Creative Courses" />
        <meta property="og:locale" content={locale === 'de' ? 'de_DE' : 'en_US'} />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EduHub | opencampus.sh" />
        <meta name="twitter:description" content={t('seo.twitterDescription')} />
        <meta name="twitter:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
        <meta name="twitter:image:alt" content="EduHub Learning Platform - Tech, Business and Creative Courses" />
        <meta name="twitter:site" content="@opencampus_sh" />
        <meta name="twitter:creator" content="@opencampus_sh" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#0F0F0F" />
        <meta name="msapplication-TileColor" content="#0F0F0F" />
        <meta name="apple-mobile-web-app-title" content="EduHub" />
        <meta name="application-name" content="EduHub" />
        
        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "EduHub",
              "alternateName": "EduHub by opencampus.sh",
              "url": "https://edu.opencampus.sh",
              "logo": "https://edu.opencampus.sh/favicon.png",
              "description": t('seo.metaDescription'),
              "founder": {
                "@type": "Organization",
                "name": "Campus Business Box e.V. // opencampus.sh"
              },
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Fraunhoferstr. 13",
                "addressLocality": "Kiel",
                "postalCode": "24118",
                "addressCountry": "DE"
              },
              "sameAs": [
                "https://norden.social/@opencampus_sh",
                "https://www.linkedin.com/school/opencampus-sh",
                "https://www.instagram.com/opencampus.sh?igsh=a3dlN2J4bXo2ejM0",
                "https://twitter.com/opencampus_sh"
              ],
              "offers": {
                "@type": "Offer",
                "category": "Educational Courses",
                "description": "Online courses in technology, business, and creative fields"
              }
            })
          }}
        />
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
              {renderHomeSliders()}
            </ClientOnly>
          )}
        </div>

        {/* FAQ Section */}
        {appSettingsData?.AppSettings[0]?.showFaqSection && (
          <div className="max-w-screen-xl mx-auto px-3 md:px-16 py-16">
            <ClientOnly>
              <FaqSection collection={appSettingsData?.AppSettings[0]?.faqCollectionName || 'default'} />
            </ClientOnly>
          </div>
        )}
      </Page>

      {/* Session Expired Notification */}
      <NotificationSnackbar
        open={showSessionExpiredNotification}
        onClose={() => setShowSessionExpiredNotification(false)}
        message={tCommon('session_expired_notification')}
        duration={5000}
      />
    </>
  );
};

export default Home;
