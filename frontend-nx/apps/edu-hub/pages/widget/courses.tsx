import { FC, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import { ClientOnly } from '@opencampus/shared-components';

import { client } from '../../config/apollo';
import TileSlider from '../../components/common/TileSlider';
import Loading from '../../components/common/Loading';
import { COURSE_TILES, COURSE_TILES_BY_ORGANIZATION } from '../../queries/courseQueries';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { CourseTiles, CourseTiles_Course } from '../../queries/__generated__/CourseTiles';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';

// Type for organization-filtered courses (same structure as CourseTiles)
type CourseTilesByOrganization = CourseTiles;

const WidgetCourses: FC = () => {
  const router = useRouter();
  const { group, groups, locale, apiKey } = router.query;
  const t = useTranslations('common');

  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [apiKeyValidating, setApiKeyValidating] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Set language if provided (only on client side)
  useEffect(() => {
    if (!router.isReady) return;
    if (locale && (locale === 'de' || locale === 'en') && router.locale !== locale) {
      router.push(router.pathname, router.asPath, { locale: locale as string, shallow: true });
    }
  }, [locale, router]);

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

  // Fetch the available course group options so the widget can resolve the
  // selected group ids (including organization-owned, non-homepage groups).
  const { data: groupOptionsData } = useQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS, {
    client,
    fetchPolicy: 'network-only',
    context: {
      headers: {
        'x-hasura-role': 'anonymous',
      },
    },
  });

  // Parse the comma-separated list of selected group option ids (e.g. groups=3,7).
  const selectedGroupIds = useMemo(() => {
    if (!groups) return [] as number[];
    const raw = Array.isArray(groups) ? groups.join(',') : groups;
    return raw
      .split(',')
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => !isNaN(value));
  }, [groups]);

  // Filter courses by the selected group(s). Multiple groups are joined into a
  // single, de-duplicated list of courses.
  const filteredCourses = useMemo(() => {
    const courses = coursesData?.Course ?? [];

    // Preferred mode: explicit group option ids (supports joining several groups).
    if (selectedGroupIds.length > 0) {
      const options = (groupOptionsData?.CourseGroupOption ?? []).filter((option) =>
        selectedGroupIds.includes(option.id)
      );
      if (options.length === 0) {
        return courses;
      }
      return courses.filter((course) =>
        options.some((option) =>
          option.programType
            ? course.Program?.type === option.programType
            : course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.id === option.id)
        )
      );
    }

    // Legacy mode: a single group order (1-5).
    if (!group) {
      return courses;
    }

    const groupOrder = parseInt(group as string, 10);
    if (isNaN(groupOrder)) {
      return courses;
    }

    return courses.filter((course) =>
      course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.order === groupOrder)
    );
  }, [coursesData, group, selectedGroupIds, groupOptionsData]);

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
    return undefined;
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

