import Head from 'next/head';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { useIsAdmin, useIsSessionLoading } from '../../../hooks/authentication';
import CalendarContent from '../../../components/pages/CalendarContent/index';

const Calendar: FC = () => {
  const t = useTranslations();
  const isAdmin = useIsAdmin();
  const isSessionLoading = useIsSessionLoading();

  return (
    <>
      <Head>
        <title>EduHub | {t('calendar.title')}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {isSessionLoading ? (
        <div className="text-center py-20 text-label-secondary">{t('common.loading')}</div>
      ) : isAdmin ? (
        <CalendarContent />
      ) : (
        <div>{t('common.auth.access_denied')}</div>
      )}
    </>
  );
};

export default Calendar;
