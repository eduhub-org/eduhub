import ManageJobBoard from '../../../components/pages/ManageJobBoard';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function JobBoardSettingsPage() {
  return (
    <SettingsSectionPage itemId="jobboerse">
      <ManageJobBoard />
    </SettingsSectionPage>
  );
}
