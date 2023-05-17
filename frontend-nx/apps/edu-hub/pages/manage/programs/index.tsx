import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/Page';

import { useIsAdmin } from '../../../hooks/authentication';
import { AuthorizedPrograms } from '../../../components/program/AuthorizedPrograms';

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
      <Page>{isAdmin && <AuthorizedPrograms />}</Page>
    </>
  );
};

export default ProgramsPage;
