'use client';

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../../components/layout/Page';

import { useIsAdmin } from '../../../../hooks/authentication';
import { ManageProgramsContent } from '../../../../components/pages/ManageProgramsContent';

// export const getStaticProps = async ({ locale }: { locale: string }) => ({
//   props: {
//     ...(await serverSideTranslations(locale, ["common"])),
//   },
// });

const ProgramsPage: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>{isAdmin && <ManageProgramsContent />}</Page>
    </>
  );
};

export default ProgramsPage;
