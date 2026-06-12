import { useRouter } from 'next/router';
import { FC } from 'react';

import ManageEmailTemplateEditor from '../../../../components/pages/ManageEmailTemplateEditor';
import SettingsSectionPage from '../../../../components/pages/ManageSettings/SettingsSectionPage';

const EmailTemplateEditorPage: FC = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const templateId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  if (!Number.isInteger(templateId)) {
    return null;
  }

  return (
    <SettingsSectionPage itemId="emails">
      <ManageEmailTemplateEditor templateId={templateId} />
    </SettingsSectionPage>
  );
};

export default EmailTemplateEditorPage;
