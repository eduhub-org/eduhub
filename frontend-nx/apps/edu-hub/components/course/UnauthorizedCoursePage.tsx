import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { CoursePageDescriptionView } from '../../components/course/CoursePageDescriptionView';
import {
  useAuthedQuery,
  useInstructorQuery,
  useAdminQuery,
} from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { Course } from '../../queries/__generated__/Course';
import { COURSE } from '../../queries/course';
import { useIsAdmin, useIsInstructor } from '../../hooks/authentication';

const UnauthorizedCoursePage: FC<{ id: number }> = ({ id }) => {
  const { t } = useTranslation('course-page');
  const userId = useUserId();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const queryHook = isAdmin
    ? useAdminQuery
    : isInstructor
    ? useInstructorQuery
    : useAuthedQuery;

  const { data: courseData } = queryHook<Course>(COURSE, {
    variables: {
      id,
      userId,
    },
  });

  const course = courseData?.Course_by_pk;

  if (!course) {
    return <div>{t('courseNotAvailable')}</div>;
  }

  return <CoursePageDescriptionView course={course} />;
};

export default UnauthorizedCoursePage;
