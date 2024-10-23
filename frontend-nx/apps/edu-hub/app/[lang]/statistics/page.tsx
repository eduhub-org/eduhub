import Head from 'next/head';
import { FC } from 'react';
import { getIsAdmin } from '../../../helpers/auth';
import StatisticsContent from '../../../components/pages/StatisticsContent';

const StatisticsPage: FC = async () => {
  const isAdmin = await getIsAdmin();

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
