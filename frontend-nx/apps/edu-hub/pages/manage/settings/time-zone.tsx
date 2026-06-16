import TimeZoneSection from '../../../components/pages/ManageAppSettingsContent/TimeZoneSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function TimeZoneSettingsPage() {
  return (
    <SettingsSectionPage itemId="time-zone">
      <TimeZoneSection />
    </SettingsSectionPage>
  );
}
