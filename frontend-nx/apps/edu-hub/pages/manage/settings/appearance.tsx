import BannerSettingsSection from '../../../components/pages/ManageAppSettingsContent/BannerSettingsSection';
import HeroHeadlineSettingsSection from '../../../components/pages/ManageAppSettingsContent/HeroHeadlineSettingsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function AppearanceSettingsPage() {
  return (
    <SettingsSectionPage itemId="appearance">
      <HeroHeadlineSettingsSection />
      <BannerSettingsSection />
    </SettingsSectionPage>
  );
}
