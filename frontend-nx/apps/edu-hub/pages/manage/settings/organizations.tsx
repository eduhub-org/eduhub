import { FC } from 'react';

import ManageOrganizationsContent from '../../../components/pages/ManageOrganizationsContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

const OrganizationsSettingsPage: FC = () => (
  <SettingsSectionPage itemId="organizations">
    <ManageOrganizationsContent inSettingsLayout />
  </SettingsSectionPage>
);

export default OrganizationsSettingsPage;
