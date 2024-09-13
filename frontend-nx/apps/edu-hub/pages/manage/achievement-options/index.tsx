import useTranslation from 'next-translate/useTranslation';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import ManageAchievementOptionsContent from '../../../components/pages/ManageAchievementOptionsContent';
import CommonPageHeader from '../../../components/common/CommonPageHeader';
import { Page } from '../../../components/layout/Page';
import { DefaultAchievementOptions, QUERY_LIMIT } from '../../../helpers/achievement';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsInstructor, useIsLoggedIn } from '../../../hooks/authentication';
import { useKeycloakUserProfile, useUserId } from '../../../hooks/user';
import { ACHIEVEMENT_RECORD_TYPES } from '../../../graphql/queries/achievementOption';
import { ADMIN_COURSE_LIST } from '../../../graphql/queries/course/courseList';
import { AchievementRecordTypes } from '../../../graphql/__generated__/AchievementRecordTypes';
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from '../../../graphql/__generated__/AdminCourseList';

const AchievementOptions: FC = () => {
  const [course, setCourse] = useState(undefined as AdminCourseList_Course);
  const [recordTypes, setRecordTypes] = useState([] as string[]);

  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation('achievements-page');
  const router = useRouter();
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const courseID: number = parseInt(router.query.courseId as string, 10); // {"courseId": 0}

  const query = useAdminQuery<AdminCourseList, AdminCourseListVariables>(ADMIN_COURSE_LIST, {
    variables: {
      limit: QUERY_LIMIT,
      where: {
        id: { _eq: courseID },
      },
    },
    skip: courseID <= 0,
  });

  useEffect(() => {
    const c = [...(query.data?.Course || [])];
    if (c.length > 0) {
      setCourse(c[0]);
    }
  }, [query.data?.Course]);

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
                course={course}
              />
            )}
          </div>
        </Page>
      </div>
    </>
  );
};
export default AchievementOptions;
