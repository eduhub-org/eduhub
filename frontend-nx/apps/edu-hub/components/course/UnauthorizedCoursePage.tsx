import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { CoursePageDescriptionView } from '../../components/course/CoursePageDescriptionView';
import {
  useRoleQuery
} from '../../hooks/authedQuery';
import { COURSE } from '../../queries/course';

import type { Course, CourseVariables } from '../../queries/__generated__/Course';


const UnauthorizedCoursePage: FC<{ id: number }> = ({ id }) => {
  const { t } = useTranslation('course-page');

  const { data: courseData } = useRoleQuery<Course, CourseVariables>(COURSE, {
    variables: {
      id,
    },
  });

  const course = courseData?.Course_by_pk;

  if (!course) {
    return <div>{t('courseNotAvailable')}</div>;
  }

  return <CoursePageDescriptionView course={course} />;
};

export default UnauthorizedCoursePage;
