import { FC } from 'react';

import ManageProjectsContent from '../../../components/pages/ManageProjectsContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

const ProjectsSettingsPage: FC = () => (
  <SettingsSectionPage itemId="projects">
    <ManageProjectsContent inSettingsLayout />
  </SettingsSectionPage>
);

export default ProjectsSettingsPage;
