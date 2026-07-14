import { FC, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { client } from '../../config/apollo';
import TileSlider from '../../components/common/TileSlider';
import { JobTile } from '../../components/common/TileSlider/JobTile';
import { WidgetSliderShell } from '../../components/pages/widget/WidgetSliderShell';
import { filterJobsByWidgetSliders } from '../../helpers/filterJobsByWidgetSliders';
import { useWidgetChrome } from '../../hooks/useWidgetChrome';
import { useWidgetApiKey } from '../../hooks/useWidgetApiKey';
import { useWidgetLocale } from '../../hooks/useWidgetLocale';
import { parseWidgetGroupIds, WIDGET_ANONYMOUS_CONTEXT } from '../../hooks/widgetQueryHelpers';
import { HOME_JOB_TILES_ALL, HOME_JOB_TILES_BY_ORGANIZATION } from '../../queries/jobTile';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { HomeJobTilesAll } from '../../queries/__generated__/HomeJobTilesAll';
import { HomeJobTilesByOrganization } from '../../queries/__generated__/HomeJobTilesByOrganization';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';

type HomeJobTilesByOrganizationResult = HomeJobTilesByOrganization;

const WidgetJobs: FC = () => {
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

  const { data: jobsData, loading: jobsLoading, error: jobsError } = useQuery<
    HomeJobTilesAll | HomeJobTilesByOrganizationResult
  >(organizationId ? HOME_JOB_TILES_BY_ORGANIZATION : HOME_JOB_TILES_ALL, {
    client,
    variables: organizationId ? { organizationId, limit: 24, offset: 0 } : { limit: 24, offset: 0 },
    skip: apiKeyValidating || !router.isReady,
    fetchPolicy: 'network-only',
    context: WIDGET_ANONYMOUS_CONTEXT,
  });

  const selectedGroupIds = useMemo(() => parseWidgetGroupIds(groups), [groups]);
  const groupOrder = group ? parseInt(group as string, 10) : null;
  // Unlike projects (which carry course-group membership directly), jobs resolve
  // their slider filter through the CourseGroupOption list, so it is needed for
  // both the `groups` and the single `group` order param.
  const needsGroupOptions = selectedGroupIds.length > 0 || (groupOrder != null && !isNaN(groupOrder));

  const {
    data: groupOptionsData,
    loading: groupOptionsLoading,
    error: groupOptionsError,
  } = useQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS, {
    client,
    skip: !needsGroupOptions,
    fetchPolicy: 'network-only',
    context: WIDGET_ANONYMOUS_CONTEXT,
  });

  const filteredJobs = useMemo(() => {
    const jobs = jobsData?.JobPosting ?? [];

    return filterJobsByWidgetSliders(jobs, {
      selectedGroupIds,
      groupOrder,
      groupOptions: groupOptionsData?.CourseGroupOption ?? [],
      groupOptionsLoading,
      groupOptionsError: Boolean(groupOptionsError),
    });
  }, [jobsData, groupOrder, selectedGroupIds, groupOptionsData, groupOptionsLoading, groupOptionsError]);

  const isLoading = jobsLoading || apiKeyValidating || (needsGroupOptions && groupOptionsLoading);
  const hasError = Boolean(jobsError || apiKeyError || (needsGroupOptions && groupOptionsError));

  return (
    <WidgetSliderShell
      isLoading={isLoading}
      hasError={hasError}
      isEmpty={filteredJobs.length === 0}
      errorMessage={t('widget_error_loading_jobs')}
      emptyMessage={t('widget_no_jobs_available')}
      apiKeyError={apiKeyError}
    >
      {/* JobTile always opens the Stujo detail page in a new tab, so it needs no isWidget prop. */}
      <TileSlider items={filteredJobs} renderTile={(job) => <JobTile job={job} />} isWidget={true} />
    </WidgetSliderShell>
  );
};

export default WidgetJobs;
