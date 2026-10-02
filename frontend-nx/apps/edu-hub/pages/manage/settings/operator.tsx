import OperatorSettingsSection from '../../../components/pages/ManageAppSettingsContent/OperatorSettingsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function OperatorSettingsPage() {
  return (
    <SettingsSectionPage itemId="operator">
      <OperatorSettingsSection />
    </SettingsSectionPage>
  );
}
