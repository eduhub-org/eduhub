import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { getIsLoggedIn } from '../../../helpers/auth';
import ProfileOverview from '../../../components/pages/ProfileContent/ProfileOverview';
import { Metadata } from 'next';
import getT from 'next-translate/getT';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getT(params.lang, ['metadata']);

  return {
    title: t('metadata:profile.title'),
    description: t('metadata:profile.description'),
  };
}

const Profile: FC = async () => {
  const isLoggedIn = await getIsLoggedIn();

  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">{isLoggedIn && <ProfileOverview />}</div>
        </Page>
      </div>
    </>
  );
};

export default Profile;
