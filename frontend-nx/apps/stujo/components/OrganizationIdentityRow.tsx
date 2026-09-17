import Link from 'next/link';
import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import OrganizationProfileDialog from './OrganizationProfileDialog';
import OrganizationSwitcher from './OrganizationSwitcher';
import { resolveStorageUrl } from '../lib/storage';
import { websiteHref, websiteLabel } from '../lib/website';
import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organizations: EmployerOrganization[];
  organization: EmployerOrganization;
  onSelectOrganization: (id: number) => void;
  onOrganizationUpdated: () => void;
}

/**
 * Identity bar of the employer dashboard: logo, company (name or picker),
 * website link, and the one entry point into the company profile dialog.
 *
 * A single row bounded by hairlines rather than a card — the header sits
 * directly above the postings list and must not push it down. Logo and website
 * are *shown* here and *edited* in the dialog, so the header carries no
 * permanently armed form for a value that changes about once a year.
 */
const OrganizationIdentityRow: FC<Props> = ({
  organizations,
  organization,
  onSelectOrganization,
  onOrganizationUpdated,
}) => {
  const t = useTranslations('meinStujo');
  const [dialogOpen, setDialogOpen] = useState(false);
  // A stored logo can still 404 (dev bucket wiped, legacy path): fall back to
  // the placeholder so the row keeps its height instead of showing the
  // browser's broken-image glyph.
  const [logoBroken, setLogoBroken] = useState(false);

  const logoUrl = logoBroken ? null : resolveStorageUrl(organization.logo);
  const href = websiteHref(organization.website);
  const label = websiteLabel(organization.website);

  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  return (
    <>
      <div className="stujo-org-identity">
        {logoUrl ? (
          <span className="stujo-org-logo">
            <img
              src={logoUrl}
              alt={t('organizationProfile.logoAlt', { organization: organization.name })}
              onError={() => setLogoBroken(true)}
            />
          </span>
        ) : (
          // Decorative only: the company name is announced right next to it.
          <span className="stujo-org-logo stujo-org-logo--empty" aria-hidden="true">
            {organization.name.trim().charAt(0).toUpperCase()}
          </span>
        )}

        <div className="stujo-org-identity-main">
          {organizations.length > 1 ? (
            <OrganizationSwitcher
              variant="inline"
              organizations={organizations}
              selectedId={organization.id}
              label={t('organizationLabel')}
              onSelect={onSelectOrganization}
            />
          ) : (
            <span className="stujo-org-name">{organization.name}</span>
          )}

          <span className="stujo-org-sep" aria-hidden="true">
            ·
          </span>

          {href ? (
            <a className="stujo-org-website" href={href} target="_blank" rel="noreferrer" title={href}>
              {label}
            </a>
          ) : (
            <button type="button" className="stujo-linkish" onClick={openDialog}>
              {t('organizationWebsite.none')}
            </button>
          )}
        </div>

        <button
          type="button"
          className="stujo-btn stujo-btn--small stujo-btn--ghost stujo-org-edit"
          aria-label={t('organizationProfile.editButtonAria', { organization: organization.name })}
          onClick={openDialog}
        >
          {t('organizationProfile.editButton')}
        </button>
      </div>

      <p className="stujo-muted stujo-org-addanother">
        <Link href="/mein-stujo/unternehmen">{t('claimAddAnother')}</Link>
      </p>

      <OrganizationProfileDialog
        open={dialogOpen}
        onClose={closeDialog}
        organization={organization}
        onOrganizationUpdated={onOrganizationUpdated}
      />
    </>
  );
};

export default OrganizationIdentityRow;
