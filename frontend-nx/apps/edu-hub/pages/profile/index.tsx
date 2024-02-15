import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';
import { useIsLoggedIn } from '../../hooks/authentication';
import ProfileOverview from '../../components/pages/ProfileContent/ProfileOverview';

const Profile: FC = () => {
  //const { t } = useTranslation('users');
  const isLoggedIn = useIsLoggedIn();

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
