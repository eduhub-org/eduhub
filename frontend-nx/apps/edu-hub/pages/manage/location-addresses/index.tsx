import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin } from '../../../hooks/authentication';
import ManageLocationAddressesContent from '../../../components/pages/ManageLocationAddressesContent';

const LocationAddresses: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>Manage Location Addresses</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isAdmin && <ManageLocationAddressesContent />}</div>
      </Page>
    </>
  );
};

export default LocationAddresses;
