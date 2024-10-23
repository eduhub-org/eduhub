import Head from 'next/head';
import { FC } from 'react';
import { useIsAdmin } from '../../hooks/authentication';
import StatisticsContent from '../../components/pages/StatisticsContent';

const StatisticsPage: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>EduHub | Enrollment Statistics</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {isAdmin ? <StatisticsContent /> : <div>Access denied</div>}
    </>
  );
};

export default StatisticsPage;
