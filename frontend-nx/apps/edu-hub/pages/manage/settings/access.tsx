import { FC } from 'react';

import ManageAdminUsersContent from '../../../components/pages/ManageAdminUsersContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';
import { ManagementRoleProvider } from '../../../hooks/managementRole';

const AccessSettingsPage: FC = () => (
  <SettingsSectionPage itemId="access" allowOrgAdmin>
    <ManagementRoleProvider>
      <ManageAdminUsersContent inSettingsLayout />
    </ManagementRoleProvider>
  </SettingsSectionPage>
);

export default AccessSettingsPage;
