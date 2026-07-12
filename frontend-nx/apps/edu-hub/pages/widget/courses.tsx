import { FC, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { client } from '../../config/apollo';
import TileSlider from '../../components/common/TileSlider';
import { TileWidget } from '../../components/common/TileSlider/TileWidget';
import { WidgetSliderShell } from '../../components/pages/widget/WidgetSliderShell';
import { useWidgetChrome } from '../../hooks/useWidgetChrome';
import { useWidgetApiKey } from '../../hooks/useWidgetApiKey';
import { useWidgetLocale } from '../../hooks/useWidgetLocale';
import { parseWidgetGroupIds, WIDGET_ANONYMOUS_CONTEXT } from '../../hooks/widgetQueryHelpers';
import { COURSE_TILES, COURSE_TILES_BY_ORGANIZATION } from '../../queries/courseQueries';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { CourseTiles, CourseTiles_Course } from '../../queries/__generated__/CourseTiles';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';

type CourseTilesByOrganization = CourseTiles;

const WidgetCourses: FC = () => {
  const router = useRouter();
  const { group, groups, locale, apiKey } = router.query;
  const t = useTranslations('common');

  useWidgetChrome();
  useWidgetLocale(router, locale);
  const {
    organizationId,
    validating: apiKeyValidating,
    error: apiKeyError,
  } = useWidgetApiKey(apiKey, router.isReady);

  const { data: coursesData, loading: coursesLoading, error: coursesError } = useQuery<
    CourseTiles | CourseTilesByOrganization
  >(organizationId ? COURSE_TILES_BY_ORGANIZATION : COURSE_TILES, {
    client,
    variables: organizationId ? { organizationId } : undefined,
    skip: apiKeyValidating || !router.isReady,
    fetchPolicy: 'network-only',
    context: WIDGET_ANONYMOUS_CONTEXT,
  });

  const selectedGroupIds = useMemo(() => parseWidgetGroupIds(groups), [groups]);

  const {
    data: groupOptionsData,
    loading: groupOptionsLoading,
    error: groupOptionsError,
  } = useQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS, {
    client,
    skip: selectedGroupIds.length === 0,
    fetchPolicy: 'network-only',
    context: WIDGET_ANONYMOUS_CONTEXT,
  });

  const filteredCourses = useMemo(() => {
    const courses = coursesData?.Course ?? [];

    if (selectedGroupIds.length > 0) {
      if (groupOptionsLoading || groupOptionsError) {
        return [];
      }
      const options = (groupOptionsData?.CourseGroupOption ?? []).filter((option) =>
        selectedGroupIds.includes(option.id)
      );
      if (options.length === 0) {
        return [];
      }
      return courses.filter((course) =>
        options.some((option) =>
          option.programType
            ? course.Program?.type === option.programType
            : course.CourseGroups.some((courseGroup) => courseGroup.CourseGroupOption.id === option.id)
        )
      );
    }

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
  }, [coursesData, group, selectedGroupIds, groupOptionsData, groupOptionsLoading, groupOptionsError]);

  const publishedCourses = useMemo(() => {
    return filteredCourses.filter((course) => {
      const courseWithPublished = course as CourseTiles_Course & { published?: boolean };
      return courseWithPublished.published === true && course.Program?.published === true;
    });
  }, [filteredCourses]);

  const isLoading =
    coursesLoading || apiKeyValidating || (selectedGroupIds.length > 0 && groupOptionsLoading);
  const hasError = Boolean(coursesError || apiKeyError);

  return (
    <WidgetSliderShell
      isLoading={isLoading}
      hasError={hasError}
      isEmpty={publishedCourses.length === 0}
      errorMessage={t('widget_error_loading_courses')}
      emptyMessage={t('widget_no_courses_available')}
      apiKeyError={apiKeyError}
    >
      <TileSlider
        items={publishedCourses}
        renderTile={(course) => <TileWidget course={course} />}
        isWidget={true}
      />
    </WidgetSliderShell>
  );
};

export default WidgetCourses;
