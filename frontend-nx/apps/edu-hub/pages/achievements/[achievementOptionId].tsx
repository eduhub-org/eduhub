import Head from 'next/head';
import { Page } from '../../components/Page';
import { useRouter } from 'next/router';
import {
  useIsAdmin,
  useIsInstructor,
  useIsLoggedIn,
} from '../../hooks/authentication';
import { FC, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import CommonPageHeader from '../../components/common/CommonPageHeader';

import { useAdminQuery } from '../../hooks/authedQuery';
import { ACHIEVEMENT_OPTIONS } from '../../queries/achievement';
import {
  AchievementOptionQuery,
  AchievementOptionQueryVariables,
  AchievementOptionQuery_AchievementOption,
} from '../../queries/__generated__/AchievementOptionQuery';
import Loading from 'apps/edu-hub/components/courses/Loading';
import Image from 'next/image';
import { ContentRow } from 'apps/edu-hub/components/common/ContentRow';
import { makeFullName } from 'apps/edu-hub/helpers/util';
import { Button } from '../../components/common/Button';
const AchievementOptionDetails: FC = () => {
  const router = useRouter();
  const { achievementOptionId } = router.query;
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();

  const { t } = useTranslation('common');
  const id =
    typeof achievementOptionId === 'string' ? parseInt(achievementOptionId) : 0;

  const achievementOptionQuery = useAdminQuery<
    AchievementOptionQuery,
    AchievementOptionQueryVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
      where: { id: { _eq: id } },
    },
    skip: id <= 0,
  });

  const achievementOptions = [
    ...(achievementOptionQuery.data?.AchievementOption || []),
  ];

  const details = achievementOptions.length > 0 ? achievementOptions[0] : null;
  return (
    <>
      <Head>
        <title>
          {achievementOptionQuery.loading
            ? 'Loading'
            : details
            ? details.title
            : t('achievement-option')}
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {/* <CommonPageHeader headline={`${id}`} /> */}
          {!isLoggedIn || !isAdmin || !isInstructor ? (
            <p>{t('not-logged-in-message')}</p>
          ) : achievementOptionQuery.loading ? (
            <Loading></Loading>
          ) : details === null ? (
            <p>{t('invalid-request')}</p>
          ) : (
            <AchievementOptionDetailsDashboard achievementOption={details} />
          )}
        </div>
      </Page>
    </>
  );
};

export default AchievementOptionDetails;

interface IProps {
  achievementOption: AchievementOptionQuery_AchievementOption;
}
const AchievementOptionDetailsDashboard: FC<IProps> = ({
  achievementOption,
}) => {
  const { t } = useTranslation('achievements-page');
  const upload = useCallback(() => {
    console.log('');
  }, []);
  return (
    <div className="flex flex-col gap-8">
      <div className="min-h-[375px] min-w-[194px]">
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Image
            alt="Mountains"
            src="https://picsum.photos/375/194"
            width={375}
            height={194}
          />
        </div>
      </div>
      <ContentRow
        className="w-full"
        leftTop={
          <h2 className="uppercase">
            {achievementOption.AchievementOptionCourses[0]?.Course.title}
          </h2>
        }
        rightBottom={
          <h2 className="uppercase">
            {
              achievementOption.AchievementOptionCourses[0]?.Course.Program
                .shortTitle
            }
          </h2>
        }
      />
      <CommonPageHeader headline={achievementOption.title} />
      <div id="mentors">
        {achievementOption.AchievementOptionMentors.map((m, index) => (
          <h1 key={index}>{makeFullName(m.User.firstName, m.User.lastName)}</h1>
        ))}
      </div>

      <div id="description">{achievementOption.description}</div>
      <div id="results" className="flex flex-col gap-2">
        <p>{t('results')}</p>
        <div>
          <Button onClick={upload} filled>{`${t('upload')}`}</Button>
        </div>
      </div>
    </div>
  );
};
