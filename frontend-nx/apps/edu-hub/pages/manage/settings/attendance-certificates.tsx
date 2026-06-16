import AttendanceCertificatesSection from '../../../components/pages/ManageAppSettingsContent/AttendanceCertificatesSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function AttendanceCertificatesSettingsPage() {
  return (
    <SettingsSectionPage itemId="attendance-certificates">
      <AttendanceCertificatesSection />
    </SettingsSectionPage>
  );
}
