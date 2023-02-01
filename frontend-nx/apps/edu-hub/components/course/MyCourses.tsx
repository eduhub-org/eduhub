import { FC } from 'react';

import { useAdminQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { MyCourses as MyCoursesType } from '../../queries/__generated__/MyCourses';
import { MY_COURSES } from '../../queries/myCourses';
import { Button } from '../common/Button';

import { TileSlider } from './TileSlider';
import useTranslation from 'next-translate/useTranslation';

export const MyCourses: FC = () => {
  const userId = useUserId();
  const { t } = useTranslation('course-page');
  const { data } = useAdminQuery<MyCoursesType>(MY_COURSES, {
    variables: {
      userId,
    },
  });

  const enrollments = data?.User_by_pk?.CourseEnrollments ?? [];

  const courses = enrollments?.map((enrollment) => enrollment.Course) ?? [];

  if ((courses.length ?? 0) <= 0) {
    return (
      <div className="flex flex-col space-y-10 justify-center items-center">
        <span className="text-xl font-bold">{t('no-course-taken')}</span>
        <Button as="a" href="#courses" filled>
          {t('discover-courses')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-semibold text-center mt-20">
        {t('your-courses')}
      </h2>
      <div className="mt-11">
        <TileSlider courses={courses ?? []} />
      </div>
    </>
  );
};
