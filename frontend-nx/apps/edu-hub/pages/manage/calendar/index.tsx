import Head from 'next/head';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { useIsAdmin, useIsOrgAdmin, useIsSessionLoading } from '../../../hooks/authentication';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import CalendarContent from '../../../components/pages/CalendarContent/index';

const Calendar: FC = () => {
  const t = useTranslations();
  const isAdmin = useIsAdmin();
  // Org admins see the calendar of the programs they manage (scoped in CalendarContent).
  const isOrgAdmin = useIsOrgAdmin();
  const isSessionLoading = useIsSessionLoading();

  return (
    <>
      <Head>
        <title>EduHub | {t('calendar.title')}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {isSessionLoading ? (
        <div className="text-center py-20 text-label-secondary">{t('common.loading')}</div>
      ) : isAdmin || isOrgAdmin ? (
        <ManagementRoleProvider>
          <CalendarContent />
        </ManagementRoleProvider>
      ) : (
        <div>{t('common.auth.access_denied')}</div>
      )}
    </>
  );
};

export default Calendar;
