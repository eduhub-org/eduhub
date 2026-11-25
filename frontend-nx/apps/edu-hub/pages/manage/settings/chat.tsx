import ChatSettingsSection from '../../../components/pages/ManageAppSettingsContent/ChatSettingsSection';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

export default function ChatSettingsPage() {
  return (
    <SettingsSectionPage itemId="chat">
      <ChatSettingsSection />
    </SettingsSectionPage>
  );
}
