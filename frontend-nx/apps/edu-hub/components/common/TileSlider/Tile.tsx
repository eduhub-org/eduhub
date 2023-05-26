import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import {
  enrollmentStatusForCourse,
  hasEnrollments,
  hasProgram,
} from '../../../helpers/courseHelpers';
import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CourseListWithEnrollments_Course } from '../../../queries/__generated__/CourseListWithEnrollments';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../queries/__generated__/CourseWithEnrollment';
import { useIsInstructor } from '../../../hooks/authentication';
import { OuterExpressionKinds } from 'typescript';

import languageIcon from '../../../public/images/course/language.svg';
import locationIcon from '../../../public/images/course/pin.svg';
interface IProps {
  course: CourseList_Course | CourseListWithEnrollments_Course;
  isManage: boolean;
}

const colorForEnrollmentStatus = (
  status: CourseEnrollmentStatus_enum | 'NOT_APPLIED',
  enrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | undefined
): string => {
  if (
    status === CourseEnrollmentStatus_enum.APPLIED ||
    status === CourseEnrollmentStatus_enum.CONFIRMED
  ) {
    return 'bg-edu-course-current';
  }
  if (
    status === CourseEnrollmentStatus_enum.REJECTED ||
    status === CourseEnrollmentStatus_enum.ABORTED
  ) {
    return 'bg-gray-300';
  }
  if (status === CourseEnrollmentStatus_enum.INVITED) {
    if (
      !enrollment?.invitationExpirationDate ||
      (enrollment && new Date() < enrollment.invitationExpirationDate)
    ) {
      return 'bg-edu-course-invited';
    } else {
      // invitation is expired
      return 'bg-gray-300';
    }
  }
  return '';
};

const CourseStatusIndicator: FC<{
  enrollmentStatus: CourseEnrollmentStatus_enum | 'NOT_APPLIED';
  enrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | undefined;
}> = ({ enrollmentStatus, enrollment }) => {
  const color = colorForEnrollmentStatus(enrollmentStatus, enrollment);

  if (enrollmentStatus === CourseEnrollmentStatus_enum.COMPLETED) {
    return (
      <div className="absolute top-0 right-3">
        <Image
          src="/images/course/completed_flag.svg"
          width={37}
          height={46}
          alt="completed flag"
        />
      </div>
    );
  } else {
    return (
      <div className="absolute top-3 right-3">
        <div className={`rounded-full w-9 h-9 ${color}`} />;
      </div>
    );
  }
};

export const Tile: FC<IProps> = ({ course, isManage }) => {
  const { t } = useTranslation('common');

  const enrollmentStatus = enrollmentStatusForCourse(course);
  // const { t } = useTranslation('course-page');
  const program = hasProgram(course) ? course.Program : undefined;
  const enrollment =
    hasEnrollments(course) && course.CourseEnrollments.length === 1
      ? course.CourseEnrollments[0]
      : undefined;

  const currentDate = new Date();
  const isCurrentProgram =
    !!program &&
    program?.applicationStart <= currentDate &&
    currentDate <= program?.achievementRecordUploadDeadline;

  // const highlightColor =
  //   enrollmentStatus === CourseEnrollmentStatus_enum.CONFIRMED &&
  //   isCurrentProgram
  //     ? 'bg-edu-course-current'
  //     : 'bg-gray-100';

  const courseDateTimeString = `${
    course.weekDay ? `${t(course.weekDay)} ` : ''
  }${
    course.startTime && course.endTime
      ? `${new Date(course.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${new Date(course.endTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : ''
  }`;

  return (
    <Link
      href={isManage ? `/manage/course/${course.id}` : `/course/${course.id}`}
    >
      <div className="relative flex-col rounded-2xl overflow-hidden font-medium text-edu-black">
        {/* <div className="relative w-60 h-72 rounded-2xl overflow-hidden"></div> */}
        <div
          className="h-[230px] p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat bg-[image:var(--bg-small-url)]"
          style={
            // {
            //   '--bg-small-url':
            //     "linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url('https://picsum.photos/240/144')",
            // } as React.CSSProperties
            {
              '--bg-small-url': `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url(${
                course?.coverImage || 'https://picsum.photos/240/144'
              })`,
            } as React.CSSProperties
          }
        >
          <span>{course.title}</span>
          {/* <CourseStatusIndicator
            enrollmentStatus={enrollmentStatus}
            enrollment={enrollment}
          /> */}
        </div>
        <div className={`flex h-[201px] flex-col justify-between bg-white p-5`}>
          <div className="flex justify-between mb-3">
            <div className="text-sm tracking-wider">
              {course.weekDay !== 'NONE' && course.startTime && course.endTime
                ? `${t(course.weekDay)} ${new Date(
                    course.startTime
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${new Date(course.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : null}
            </div>
            <div className="text-sm tracking-widest flex content-center">
              <img
                className="w-4 h-4 mr-2"
                src={languageIcon}
                alt="language icon"
              />{' '}
              {t(course.language)}
            </div>
          </div>
          <span className="text-lg mb-auto line-clamp-3">{course.tagline}</span>
          <span className="text-xs uppercase flex content-center">
            <img className="h-4 mr-2" src={locationIcon} alt="location icon" />
            {course.CourseLocations.length > 2
              ? course.CourseLocations.map(
                  (location) => `${location.locationOption} +`
                ).join('')
              : course.CourseLocations.map(
                  (location) => `${location.locationOption}`
                ).join(' + ')}
          </span>
        </div>
      </div>
    </Link>
  );
};
