import CourseGroupOptionsManager from '../../../components/pages/ManageAppSettingsContent/CourseGroupOptionsManager';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function CourseGroupsSettingsPage() {
  return (
    <SettingsSectionPage itemId="course-groups">
      <CourseGroupOptionsManager />
    </SettingsSectionPage>
  );
}
