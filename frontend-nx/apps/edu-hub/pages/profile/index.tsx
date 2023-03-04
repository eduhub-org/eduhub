import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../components/Page';
import { useIsLoggedIn } from '../../hooks/authentication';
import ProfileOverview from '../../components/profile/ProfileOverview';

// export const getStaticProps = async ({ locale }: { locale: string }) => ({
//   props: {
//     ...(await serverSideTranslations(locale, ["common", "users"])),
//   },
// });

const Profile: FC = () => {
  const { t } = useTranslation('users');
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <div className="max-w-screen-xl mx-auto mt-14">
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">
            {isLoggedIn && <ProfileOverview />}
          </div>
        </Page>
      </div>
    </>
  );
};

export default Profile;
