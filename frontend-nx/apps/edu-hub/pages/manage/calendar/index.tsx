import Head from 'next/head';
import { FC } from 'react';
import { useIsAdmin } from '../../../hooks/authentication';
import CalendarContent from '../../../components/pages/CalendarContent/index';

const Calendar: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>EduHub | Calendar</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {isAdmin ? <CalendarContent /> : <div>Access denied</div>}
    </>
  );
};

export default Calendar;
