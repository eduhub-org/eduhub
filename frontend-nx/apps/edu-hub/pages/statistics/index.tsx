import Head from 'next/head';
import { FC } from 'react';
import { useIsAdmin } from '../../hooks/authentication';
import EnrollmentStatisticsContent from '../../components/pages/EnrollmenteStatisticsContent';

const EnrollmentStatisticsPage: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>EduHub | Enrollment Statistics</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {isAdmin ? <EnrollmentStatisticsContent /> : <div>Access denied</div>}
    </>
  );
};

export default EnrollmentStatisticsPage;