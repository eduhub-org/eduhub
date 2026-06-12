import ProjectDocumentationInstructionsSection from '../../../components/pages/ManageAppSettingsContent/ProjectDocumentationInstructionsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function DocumentationInstructionsSettingsPage() {
  return (
    <SettingsSectionPage itemId="documentation-instructions">
      <ProjectDocumentationInstructionsSection />
    </SettingsSectionPage>
  );
}
