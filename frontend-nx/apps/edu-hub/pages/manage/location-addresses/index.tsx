// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import { GetServerSideProps } from 'next';

/** @deprecated Use /manage/settings/location-addresses — kept for bookmarks and external links. */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/manage/settings/location-addresses', permanent: false },
});

export default function ManageLocationAddressesRedirect() {
  return null;
}
