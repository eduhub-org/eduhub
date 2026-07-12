import { FC, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { client } from '../../config/apollo';
import TileSlider from '../../components/common/TileSlider';
import { ProjectTile } from '../../components/common/TileSlider/ProjectTile';
import { WidgetSliderShell } from '../../components/pages/widget/WidgetSliderShell';
import { filterProjectsByWidgetGroups } from '../../helpers/filterProjectsByWidgetGroups';
import { useWidgetChrome } from '../../hooks/useWidgetChrome';
import { useWidgetApiKey } from '../../hooks/useWidgetApiKey';
import { useWidgetLocale } from '../../hooks/useWidgetLocale';
import { parseWidgetGroupIds, WIDGET_ANONYMOUS_CONTEXT } from '../../hooks/widgetQueryHelpers';
import { HOME_PROJECT_TILES_ALL, HOME_PROJECT_TILES_BY_ORGANIZATION } from '../../queries/projectTile';
import { COURSE_GROUP_OPTIONS } from '../../queries/courseGroupOptions';
import { HomeProjectTilesAll } from '../../queries/__generated__/HomeProjectTilesAll';
import { HomeProjectTilesByOrganization } from '../../queries/__generated__/HomeProjectTilesByOrganization';
import { CourseGroupOptions } from '../../queries/__generated__/CourseGroupOptions';

type HomeProjectTilesByOrganizationResult = HomeProjectTilesByOrganization;

const WidgetProjects: FC = () => {
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

  const { data: projectsData, loading: projectsLoading, error: projectsError } = useQuery<
    HomeProjectTilesAll | HomeProjectTilesByOrganizationResult
  >(organizationId ? HOME_PROJECT_TILES_BY_ORGANIZATION : HOME_PROJECT_TILES_ALL, {
    client,
    variables: organizationId ? { organizationId, limit: 24, offset: 0 } : { limit: 24, offset: 0 },
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

  const filteredProjects = useMemo(() => {
    const projects = projectsData?.Project ?? [];
    const groupOrder = group ? parseInt(group as string, 10) : null;

    return filterProjectsByWidgetGroups(projects, {
      selectedGroupIds,
      groupOrder,
      groupOptions: groupOptionsData?.CourseGroupOption ?? [],
      groupOptionsLoading,
      groupOptionsError: Boolean(groupOptionsError),
    });
  }, [
    projectsData,
    group,
    selectedGroupIds,
    groupOptionsData,
    groupOptionsLoading,
    groupOptionsError,
  ]);

  const isLoading = projectsLoading || apiKeyValidating || (selectedGroupIds.length > 0 && groupOptionsLoading);
  const hasError = Boolean(
    projectsError || apiKeyError || (selectedGroupIds.length > 0 && groupOptionsError)
  );

  return (
    <WidgetSliderShell
      isLoading={isLoading}
      hasError={hasError}
      isEmpty={filteredProjects.length === 0}
      errorMessage={t('widget_error_loading_projects')}
      emptyMessage={t('widget_no_projects_available')}
      apiKeyError={apiKeyError}
    >
      <TileSlider
        items={filteredProjects}
        renderTile={(project) => <ProjectTile project={project} context="public" isWidget />}
        isWidget={true}
      />
    </WidgetSliderShell>
  );
};

export default WidgetProjects;
