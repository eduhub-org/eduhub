import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { getWeekdayStartAndEndString } from '../../helpers/dateHelpers';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import { BlockTitle } from '@opencampus/shared-components';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseTitleSubTitleBlock: FC<IProps> = ({ course }) => {
  const { t, lang } = useTranslation();
  return (
    <div className="flex flex-1 flex-col text-white mb-20">
      <span className="text-xs">
        {getWeekdayStartAndEndString(course, lang, t)}
      </span>
      <span className="text-2xl mt-2">{course.tagline}</span>
    </div>
  );
};
