import { createServerApolloClient } from '../config/apolloServer';
import { HOME_SLIDER_ORGANIZATIONS } from '../queries/homeSliderOrganizations';
import { HomeSliderOrganizations } from '../queries/__generated__/HomeSliderOrganizations';
import { includedOrganizationIds } from './homeSliderOrganizations';

/**
 * The organizations whose events the public feeds list: the same set as the homepage sliders, so
 * the feeds and the homepage always show the same events.
 */
export const loadFeedOrganizationIds = async (client: ReturnType<typeof createServerApolloClient>) => {
  const { data } = await client.query<HomeSliderOrganizations>({ query: HOME_SLIDER_ORGANIZATIONS });
  return includedOrganizationIds(data?.HomeSliderOrganization);
};
