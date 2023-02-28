import Image from 'next/image';
import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ContentRow } from '../common/ContentRow';

import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { useUser, useUserId } from '../../hooks/user';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import {
  CourseWithEnrollment,
  CourseWithEnrollmentVariables,
} from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';

import {
  getEndTimeString,
  getStartTimeString,
  getWeekdayString,
} from '../../helpers/dateHelpers';
// import { Course_Course_by_pk } from '../../queries/__generated__/Course';

import { Attendances } from './Attendances';
import CourseAchievementOption from './course-achievement-option/CourseAchievementOption';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseParticipationBlock: FC<IProps> = ({ course }) => {
  const { t, lang } = useTranslation();
  const { t: tLanguage } = useTranslation('common');

  const startTime = getStartTimeString(course, lang);
  const endTime = getEndTimeString(course, lang);

  const user = useUser();
  const userId = useUserId();
  const { data } = useAuthedQuery<
    CourseWithEnrollment,
    CourseWithEnrollmentVariables
  >(COURSE_WITH_ENROLLMENT, {
    variables: {
      id: course.id,
      userId,
    },
  });

  const enrollments = data?.Course_by_pk?.CourseEnrollments;
  const status = enrollments && enrollments[0]?.status;

  let content = null;

  if (
    status === CourseEnrollmentStatus_enum.CONFIRMED ||
    status === CourseEnrollmentStatus_enum.COMPLETED
  ) {
    content = (
      <ContentRow
        className="my-24 text-white"
        leftTop={
          <div className="flex flex-1">
            {/* <Attendances course={course} /> */}
          </div>
        }
        rightBottom={
          <div className="flex flex-1">
            {course.achievementCertificatePossible && (
              <CourseAchievementOption
                courseId={course.id}
                achievementRecordUploadDeadline={
                  course.Program.achievementRecordUploadDeadline
                }
                courseTitle={course.title}
                t={t}
              />
            )}
          </div>
        }
      />
    );
  } else {
    content = null;
  }

  return (
    <>
      <div className="mx-auto">{content}</div>{' '}
    </>
  );
};
