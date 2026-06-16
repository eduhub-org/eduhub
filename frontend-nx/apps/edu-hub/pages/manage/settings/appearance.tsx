import BannerSettingsSection from '../../../components/pages/ManageAppSettingsContent/BannerSettingsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function AppearanceSettingsPage() {
  return (
    <SettingsSectionPage itemId="appearance">
      <BannerSettingsSection />
    </SettingsSectionPage>
  );
}
