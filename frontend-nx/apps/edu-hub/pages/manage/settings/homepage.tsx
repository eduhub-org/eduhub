import FaqSettingsSection from '../../../components/pages/ManageAppSettingsContent/FaqSettingsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function HomepageSettingsPage() {
  return (
    <SettingsSectionPage itemId="homepage">
      <FaqSettingsSection />
    </SettingsSectionPage>
  );
}
