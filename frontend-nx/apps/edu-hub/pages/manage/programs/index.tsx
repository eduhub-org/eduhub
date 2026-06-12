import path from 'path';
path.resolve('./next.config.js');

import { GetServerSideProps } from 'next';

/** @deprecated Use /manage/settings/programs — kept for bookmarks and external links. */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/manage/settings/programs', permanent: false },
});

export default function ManageProgramsRedirect() {
  return null;
}
