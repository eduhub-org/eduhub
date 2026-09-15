import { FC } from 'react';
import { useTranslations } from 'next-intl';

// Shared infrastructure reused from the edu-hub app (via the @eduhub/*
// tsconfig alias + externalDir) until it is extracted into root libs/. See
// apps/stujo/pages/_app.tsx for the other established uses of this pattern.
import ImageUploader from '@eduhub/components/inputs/ImageUploader';

import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organization: EmployerOrganization;
  onLogoUpdated: () => void;
}

/**
 * Compact logo editor for the currently selected organization, placed to the
 * right of OrganizationSwitcher. Reuses ImageUploader's organizationLogo
 * element -- the same one edu-hub's organization settings row inlines
 * permanently -- in its compact 'trigger' layout: a small button opens a
 * popover with change/remove/view-full-size controls instead of a
 * permanently visible upload field.
 *
 * Authorization is enforced server-side by the save/removeOrganizationLogo
 * actions, not here: a settings admin may always change the logo, and a
 * job-offer-only admin (the capability every StuJo dashboard organization
 * implies, since MY_JOB_ORGANIZATIONS filters on canManageJobs) may change it
 * too as long as the organization has no settings admin of its own. See
 * authorizeOrganizationAdminFieldChange in functions/callNodeFunction/lib for the
 * exact rule. A caller who no longer qualifies (the organization has since
 * gained a settings admin) simply sees the action's error message.
 */
const OrganizationLogoEditor: FC<Props> = ({ organization, onLogoUpdated }) => {
  const t = useTranslations('common');

  return (
    <ImageUploader
      variant="material"
      element="organizationLogo"
      layout="trigger"
      triggerLabel={t('image_uploader.organization_logo')}
      label={organization.name}
      identifierVariables={{ organizationId: organization.id }}
      currentFile={organization.logo}
      onFileUpdated={onLogoUpdated}
      acceptedFileTypes="image/*"
      maxFileSize={2 * 1024 * 1024}
    />
  );
};

export default OrganizationLogoEditor;
