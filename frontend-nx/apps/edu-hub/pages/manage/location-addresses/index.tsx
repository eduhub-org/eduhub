import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import ManageLocationAddressesContent from '../../../components/pages/ManageLocationAddressesContent';

const LocationAddresses: FC = () => {
  return (
    <>
      <Head>
        <title>Manage Location Addresses</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <ManageLocationAddressesContent />
      </Page>
    </>
  );
};

export default LocationAddresses;
