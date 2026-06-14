import { FC } from 'react';

import { ManageProgramsContent } from '../../../components/pages/ManageProgramsContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';
import { ManagementRoleProvider } from '../../../hooks/managementRole';

const ProgramsSettingsPage: FC = () => (
  <SettingsSectionPage itemId="programs" allowOrgAdmin>
    <ManagementRoleProvider>
      <ManageProgramsContent inSettingsLayout />
    </ManagementRoleProvider>
  </SettingsSectionPage>
);

export default ProgramsSettingsPage;
