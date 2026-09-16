import Head from 'next/head';
import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Page } from '../../layout/Page';
import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../../hooks/orgAdminCapabilities';
import SettingsLayout from './SettingsLayout';
import { SettingsNavItemId } from './config';

type SettingsSectionPageProps = {
  itemId: SettingsNavItemId;
  children: ReactNode;
  /** Override page title in <head> */
  pageTitle?: string;
  /** Also allow organization admins (used for Access & roles). */
  allowOrgAdmin?: boolean;
};

const SettingsSectionPage: FC<SettingsSectionPageProps> = ({
  itemId,
  children,
  pageTitle,
  allowOrgAdmin = false,
}) => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const { canManageSettings } = useOrgAdminCapabilities();
  const t = useTranslations('manageSettings');
  const title = pageTitle ?? t(`nav.items.${itemId}.label`);
  // Org admins reach these pages only with canManageSettings on at least one organization — the same
  // capability Hasura requires to actually write OrganizationAdmin/Program, so the gate matches what
  // is enforceable rather than "is an org admin of any kind."
  const canView = isAdmin || (allowOrgAdmin && isOrgAdmin && canManageSettings);

  return (
    <>
      <Head>
        <title>{`EduHub | ${title}`}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {canView ? (
            <SettingsLayout activeItemId={itemId}>{children}</SettingsLayout>
          ) : (
            <div className="p-6 text-label-secondary">{t('access_denied')}</div>
          )}
        </div>
      </Page>
    </>
  );
};

export default SettingsSectionPage;
