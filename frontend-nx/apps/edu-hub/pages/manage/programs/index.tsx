import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';

import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { ManageProgramsContent } from '../../../components/pages/ManageProgramsContent';

// export const getStaticProps = async ({ locale }: { locale: string }) => ({
//   props: {
//     ...(await serverSideTranslations(locale, ["common"])),
//   },
// });

const ProgramsPage: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        {(isAdmin || isOrgAdmin) && (
          <ManagementRoleProvider>
            <ManageProgramsContent />
          </ManagementRoleProvider>
        )}
      </Page>
    </>
  );
};

export default ProgramsPage;
