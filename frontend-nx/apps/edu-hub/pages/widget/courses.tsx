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
import { CourseTiles, CourseTiles_Course } from '../../queries/__generated__/CourseTiles';

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
        if (process.env.NODE_ENV !== 'production') {
          console.error(error);
        }
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
  // Note: CourseTiles_Course type doesn't include 'published' in generated types,
  // but the GraphQL fragment includes it, so we use type assertion
  const publishedCourses = useMemo(() => {
    return filteredCourses.filter(
      (course) => {
        const courseWithPublished = course as CourseTiles_Course & { published?: boolean };
        return courseWithPublished.published === true && course.Program?.published === true;
      }
    );
  }, [filteredCourses]);

  const isLoading = coursesLoading || apiKeyValidating;
  const hasError = coursesError || apiKeyError;

  // Add widget-page class to body and html for scoped CSS
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('widget-page');
      document.documentElement.classList.add('widget-page');
      
      return () => {
        document.body.classList.remove('widget-page');
        document.documentElement.classList.remove('widget-page');
      };
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
      </Head>
      <ClientOnly>
        <div className="min-h-[435px] h-[435px] bg-transparent overflow-hidden flex items-center">
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

