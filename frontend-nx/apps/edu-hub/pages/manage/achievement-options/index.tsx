import { useTranslations } from 'next-intl';
import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import ManageAchievementOptionsContent from '../../../components/pages/ManageAchievementOptionsContent';
import CommonPageHeader from '../../../components/common/CommonPageHeader';
import { Page } from '../../../components/layout/Page';
import { DefaultAchievementOptions } from '../../../helpers/achievement';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsInstructor, useIsLoggedIn } from '../../../hooks/authentication';
import { useKeycloakUserProfile, useUserId } from '../../../hooks/user';
import { ACHIEVEMENT_RECORD_TYPES } from '../../../queries/achievementOption';
import { AchievementRecordTypes } from '../../../queries/__generated__/AchievementRecordTypes';

const AchievementOptions: FC = () => {
  const [recordTypes, setRecordTypes] = useState([] as string[]);

  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const t = useTranslations('achievementsPage');
  const userId = useUserId();
  const profile = useKeycloakUserProfile();

  const achievementRecordTypesAPI = useAdminQuery<AchievementRecordTypes>(ACHIEVEMENT_RECORD_TYPES);

  useEffect(() => {
    const rTypes: string[] =
      achievementRecordTypesAPI?.data?.AchievementRecordType.map((v) => v.value) || DefaultAchievementOptions;
    setRecordTypes(rTypes);
  }, [achievementRecordTypesAPI?.data?.AchievementRecordType]);

  const header = isAdmin ? t('achievement-record-admin') : t('achievement-record');
  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <Head>
          <title>{t('title')}</title>
        </Head>
        <Page>
          <div className="min-h-[77vh]">
            <CommonPageHeader headline={header} />
            {isLoggedIn && (isAdmin || isInstructor) && recordTypes.length > 0 && (
              <ManageAchievementOptionsContent
                achievementRecordTypes={recordTypes}
                userId={userId}
                userProfile={profile}
              />
            )}
          </div>
        </Page>
      </div>
    </>
  );
};
export default AchievementOptions;
