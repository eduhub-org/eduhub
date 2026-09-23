import { FC } from 'react';
import { useTranslations } from 'next-intl';

// Shared infrastructure reused from the edu-hub app via the @eduhub/* alias
// (AGENTS.md rule 10): StuJo styles it through the --eduhub-* token overrides
// in styles/globals.css rather than forking the component. ImageUploader
// already pulls DialogShell into StuJo transitively via AlertMessageDialog.
import { DialogShell } from '@eduhub/components/common/dialogs/DialogShell';

import OrganizationLogoEditor from './OrganizationLogoEditor';
import OrganizationWebsiteField from './OrganizationWebsiteField';
import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  open: boolean;
  onClose: () => void;
  organization: EmployerOrganization;
  onOrganizationUpdated: () => void;
}

const TITLE_ID = 'stujo-org-profile-title';

/**
 * Company profile editor: logo and public website, the two fields an employer
 * changes roughly once a year. Each saves immediately through its own action
 * (saveOrganizationLogo / updateOrganizationWebsite), so the dialog has no
 * submit of its own and no half-saved state to reconcile — "Fertig" dismisses.
 *
 * Authorization stays server-side for both fields; a caller who no longer
 * qualifies sees the action's own error message here.
 */
const OrganizationProfileDialog: FC<Props> = ({
  open,
  onClose,
  organization,
  onOrganizationUpdated,
}) => {
  const t = useTranslations('meinStujo');

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('OrganizationProfile.title')}
      ariaLabelledBy={TITLE_ID}
      maxWidth="sm"
      fullWidth
    >
      <div className="stujo-org-profile">
        <p className="stujo-muted">{t('OrganizationProfile.intro')}</p>

        <section className="stujo-org-profile-section">
          <h3>{t('OrganizationProfile.logo_heading')}</h3>
          <OrganizationLogoEditor organization={organization} onLogoUpdated={onOrganizationUpdated} />
          <p className="stujo-field-hint">{t('OrganizationProfile.logo_hint')}</p>
        </section>

        <section className="stujo-org-profile-section">
          <h3>{t('OrganizationProfile.website_heading')}</h3>
          {/* key: resets the local draft when the user switches company while
              the dialog is mounted. */}
          <OrganizationWebsiteField
            key={organization.id}
            organization={organization}
            onWebsiteUpdated={onOrganizationUpdated}
          />
        </section>

        <div className="stujo-org-profile-actions">
          <button type="button" className="stujo-btn stujo-btn--primary" onClick={onClose}>
            {t('OrganizationProfile.done')}
          </button>
        </div>
      </div>
    </DialogShell>
  );
};

export default OrganizationProfileDialog;
