import Head from 'next/head';
import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Page } from '../../layout/Page';
import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
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
  const t = useTranslations('manageSettings');
  const title = pageTitle ?? t(`nav.items.${itemId}.label`);
  const canView = isAdmin || (allowOrgAdmin && isOrgAdmin);

  return (
    <>
      <Head>
        <title>{`EduHub | ${title}`}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {canView && (
            <SettingsLayout activeItemId={itemId}>{children}</SettingsLayout>
          )}
        </div>
      </Page>
    </>
  );
};

export default SettingsSectionPage;
