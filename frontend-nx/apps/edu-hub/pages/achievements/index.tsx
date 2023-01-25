import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import AchievementOptionDashboard from '../../components/achievements/AchievementOptionDashboard';
import CommonPageHeader from '../../components/common/CommonPageHeader';
import { Page } from '../../components/Page';
import {
  DefaultAchievementOptions,
  QUERY_LIMIT,
} from '../../helpers/achievement';
import { useAdminQuery } from '../../hooks/authedQuery';
import {
  useIsAdmin,
  useIsInstructor,
  useIsLoggedIn,
} from '../../hooks/authentication';
import { useKeycloakUserProfile, useUserId } from '../../hooks/user';
import { ACHIEVEMENT_RECORD_TYPES } from '../../queries/achievementOption';
import { ADMIN_COURSE_LIST } from '../../queries/courseList';
import { AchievementRecordTypes } from '../../queries/__generated__/AchievementRecordTypes';
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from '../../queries/__generated__/AdminCourseList';

const Achievements: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation('achievements-page');
  const router = useRouter();
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const courseID: number = parseInt(router.query.courseId as string, 10); // {"courseId": 0}
  let course: AdminCourseList_Course | undefined;

  const courseList = useAdminQuery<AdminCourseList, AdminCourseListVariables>(
    ADMIN_COURSE_LIST,
    {
      variables: {
        limit: QUERY_LIMIT,
        where: {
          id: { _eq: courseID },
        },
      },
      skip: courseID <= 0,
    }
  );
  const c = [...(courseList.data?.Course || [])];
  if (c.length > 0) {
    course = c[0];
  }

  const achievementRecordTypesAPI = useAdminQuery<AchievementRecordTypes>(
    ACHIEVEMENT_RECORD_TYPES
  );

  if (achievementRecordTypesAPI.error) {
    console.log(achievementRecordTypesAPI.error);
  }

  const achievementRecordTypes: string[] =
    achievementRecordTypesAPI?.data?.AchievementRecordType.map(
      (v) => v.value
    ) || DefaultAchievementOptions;

  const header = isAdmin
    ? t('achievement-record-admin')
    : t('achievement-record');
  return (
    <>
      <Head>
        <title>{t('title')}</title>
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          <CommonPageHeader headline={header} />
          {isLoggedIn &&
            (isAdmin || isInstructor) &&
            achievementRecordTypes.length > 0 && (
              <AchievementOptionDashboard
                achievementRecordTypes={achievementRecordTypes}
                userId={userId}
                userProfile={profile}
                course={course}
              />
            )}
        </div>
      </Page>
    </>
  );
};
export default Achievements;
