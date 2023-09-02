import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { CourseWithEnrollment_Course_by_pk } from '../../../../queries/__generated__/CourseWithEnrollment';
import { BlockTitle } from '@opencampus/shared-components';

import { AttendanceEntry } from './AttendanceEntry';

interface IProps {
  course: CourseWithEnrollment_Course_by_pk;
}

export const Attendances: FC<IProps> = ({ course }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <BlockTitle>{t('course-page:attendances')}</BlockTitle>
      <span className="text-lg mb-4">
        {t('course-page:maxMissedSessions_plural', {
          count: course.maxMissedSessions,
        })}
      </span>
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {course.Sessions.map((session) => (
            <AttendanceEntry key={session.id} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
};
