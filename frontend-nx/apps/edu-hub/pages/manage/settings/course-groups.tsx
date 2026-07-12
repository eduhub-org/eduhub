import CourseGroupOptionsManager from '../../../components/pages/ManageAppSettingsContent/CourseGroupOptionsManager';
import ProjectGroupOptionsManager from '../../../components/pages/ManageAppSettingsContent/ProjectGroupOptionsManager';
import ProjectSlidersManager from '../../../components/pages/ManageAppSettingsContent/ProjectSlidersManager';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function CourseGroupsSettingsPage() {
  return (
    <SettingsSectionPage itemId="course-groups">
      <CourseGroupOptionsManager />
      <ProjectGroupOptionsManager />
      <ProjectSlidersManager />
    </SettingsSectionPage>
  );
}
