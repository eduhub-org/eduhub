import { FC, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import { ClientOnly } from '@opencampus/shared-components';

import { client } from '../../config/apollo';
import TileSlider from '../../components/common/TileSlider';
import Loading from '../../components/common/Loading';
import { COURSE_TILES, COURSE_TILES_BY_ORGANIZATION } from '../../queries/courseQueries';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { CourseTiles } from '../../queries/__generated__/CourseTiles';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';

// Type for organization-filtered courses (same structure as CourseTiles)
type CourseTilesByOrganization = CourseTiles;

const WidgetCourses: FC = () => {
  const router = useRouter();
  const { group, lang, apiKey } = router.query;
  const { t } = useTranslation('common');

  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [apiKeyValidating, setApiKeyValidating] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Set language if provided (only on client side)
  useEffect(() => {
    if (!router.isReady) return;
    if (lang && (lang === 'de' || lang === 'en') && router.locale !== lang) {
      router.push(router.pathname, router.asPath, { locale: lang as string, shallow: true });
    }
  }, [lang, router]);

  // Validate API key if provided (only on client side)
  useEffect(() => {
    if (!router.isReady || !apiKey || typeof apiKey !== 'string') {
      return;
    }

    const validateApiKey = async () => {
      setApiKeyValidating(true);
      setApiKeyError(null);

      try {
        const response = await fetch('/api/widget/validate-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        });

        const data = await response.json();

        if (data.valid && data.organizationId) {
          setOrganizationId(data.organizationId);
        } else {
          setApiKeyError(data.error || 'Invalid API key');
        }
      } catch (error) {
        setApiKeyError('Failed to validate API key');
      } finally {
        setApiKeyValidating(false);
      }
    };

    validateApiKey();
  }, [apiKey, router.isReady]);

  // Fetch courses
  const { data: coursesData, loading: coursesLoading, error: coursesError } = useQuery<CourseTiles | CourseTilesByOrganization>(
    organizationId ? COURSE_TILES_BY_ORGANIZATION : COURSE_TILES,
    {
      client,
      variables: organizationId ? { organizationId } : undefined,
      skip: apiKeyValidating || !router.isReady,
      fetchPolicy: 'network-only', // Always fetch fresh data for widget
      context: {
        headers: {
          'x-hasura-role': 'anonymous', // Explicitly set anonymous role for widget
        },
      },
    }
  );

  // Fetch course group options
  const { data: courseGroupOptionsData } = useQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS, {
    client,
    context: {
      headers: {
        'x-hasura-role': 'anonymous', // Explicitly set anonymous role for widget
      },
    },
  });

  // Filter courses by group if specified
  const filteredCourses = useMemo(() => {
    const courses = coursesData?.Course ?? [];

    if (!group) {
      return courses;
    }

    const groupOrder = parseInt(group as string, 10);
    if (isNaN(groupOrder) || groupOrder < 1 || groupOrder > 5) {
      return courses;
    }

    return courses.filter((course) =>
      course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.order === groupOrder)
    );
  }, [coursesData, group]);

  // Filter only published courses
  const publishedCourses = useMemo(() => {
    return filteredCourses.filter(
      (course) => course.published === true && course.Program?.published === true
    );
  }, [filteredCourses]);

  const isLoading = coursesLoading || apiKeyValidating;
  const hasError = coursesError || apiKeyError;

  // Force transparent background on body and html
  useEffect(() => {
    // Set inline styles to override any CSS classes
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = 'transparent';
      document.body.style.background = 'transparent';
      if (document.documentElement) {
        document.documentElement.style.backgroundColor = 'transparent';
        document.documentElement.style.background = 'transparent';
      }
    }
  }, []);

  // Hide Cookiebot cookie consent on widget pages
  useEffect(() => {
    const hideCookiebot = () => {
      const selectors = [
        '#Cookiebot',
        '#CybotCookiebotDialog',
        '#CybotCookiebotDialogBody',
        '.Cookiebot',
        '.cookiebot',
        '[id*="cookiebot"]',
        '[class*="cookiebot"]',
        '[id*="Cookiebot"]',
        '[class*="Cookiebot"]',
      ];
      
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
          (el as HTMLElement).style.visibility = 'hidden';
          (el as HTMLElement).style.opacity = '0';
          (el as HTMLElement).style.height = '0';
          (el as HTMLElement).style.width = '0';
          (el as HTMLElement).style.overflow = 'hidden';
        });
      });
    };

    // Hide immediately and on interval to catch dynamically loaded elements
    hideCookiebot();
    const interval = setInterval(hideCookiebot, 100);
    
    // Also listen for DOM changes
    const observer = new MutationObserver(hideCookiebot);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent !important;
            background-color: transparent !important;
            overflow-x: hidden;
          }
          html {
            background: transparent !important;
            background-color: transparent !important;
            overflow-x: hidden;
          }
          /* Override any background colors from global styles - target body with class */
          body.bg-edu-bg-gray {
            background: transparent !important;
            background-color: transparent !important;
          }
          /* Ensure all container divs are transparent */
          div[class*="bg-"]:not([class*="bg-white"]):not([class*="bg-transparent"]) {
            background-color: transparent !important;
          }
          /* Specifically override the main container */
          div.min-h-\\[440px\\],
          div.min-h-\\[435px\\] {
            background-color: transparent !important;
          }
          /* Hide Cookiebot cookie consent banner/button on widget pages */
          #Cookiebot,
          #CybotCookiebotDialog,
          #CybotCookiebotDialogBody,
          .Cookiebot,
          .cookiebot,
          [id*="cookiebot"],
          [class*="cookiebot"],
          [id*="Cookiebot"],
          [class*="Cookiebot"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          /* Make swiper-wrapper background fully transparent for widget and ensure width */
          .swiper-wrapper {
            background-color: transparent !important;
            width: 100% !important;
          }
          /* Ensure no overflow on swiper container */
          .swiper {
            overflow: visible !important;
            width: 100% !important;
          }
          /* Remove any padding/margin that might cause width mismatch */
          #__next {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: transparent !important;
          }
          /* Add subtle soft shadow to tiles in widget for visibility on all backgrounds */
          .swiper-slide > a > div,
          .swiper-slide a > div,
          .swiper-slide a div.rounded-2xl {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>
      </Head>
      <ClientOnly>
        <div className="min-h-[440px] h-[440px] bg-transparent overflow-hidden flex items-center">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loading />
            </div>
          ) : hasError ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center text-white">
                <p className="mb-2">{t('widget_error_loading_courses')}</p>
                {apiKeyError && <p className="text-sm text-red-400">{apiKeyError}</p>}
              </div>
            </div>
          ) : publishedCourses.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center text-white">
                <p>{t('widget_no_courses_available')}</p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <TileSlider courses={publishedCourses} isManage={false} isWidget={true} />
            </div>
          )}
        </div>
      </ClientOnly>
    </>
  );
};

export default WidgetCourses;

