import Image from 'next/image';
import { FC } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import { useStartTimeString, useEndTimeString, getWeekdayString } from '../../../helpers/dateTimeHelpers';
import languageIcon from '../../../public/images/course/language.svg';
import pinIcon from '../../../public/images/course/pin.svg';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import UserCard from '../../common/UserCard'; // Adjust the path as needed
import React from 'react';

interface IProps {
  course: Course_Course_by_pk;
}

export const TimeLocationLanguageInstructors: FC<IProps> = ({ course }) => {
  const t = useTranslations(); // used to get weekday and language
  const tCourse = useTranslations('course');

  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();

  const startTime = getStartTimeString(course.startTime);
  const endTime = getEndTimeString(course.endTime);

  // Get ECTS translations object to handle keys with dots/commas
  const ectsTranslations = tCourse.raw('ects') as Record<string, string>;

  return (
    <div className="flex flex-1 flex-col justify-center items-center mx-6 lg:mx-0 mb-9 rounded-2xl lg:max-w-md bg-gray-100 p-12 sm:p-24">
      <div className="grid grid-cols-2 gap-x-28">
        <span className="text-lg mt-2 text-center">
          {course.weekDay != 'NONE' ? getWeekdayString(course, t, false, false) : ''}
        </span>
        <span className="text-lg mt-2 text-center">{tCourse('general.ects')}</span>
        <span className="text-sm mt-2 text-center mb-12">
          {course.weekDay !== 'NONE' && (
            <>
              {startTime}
              {endTime ? <span> - {endTime}</span> : ''}
            </>
          )}
        </span>
        <span className="text-sm mt-2 text-center">{ectsTranslations[course.ects] || course.ects}</span>
        <div className="flex justify-center w-8 h-[43px]">
          <Image src={pinIcon} alt="Location" width={32} height={43} unoptimized className="w-full h-full object-contain" />
        </div>
        <div className="flex justify-center w-[47px] h-10">
          <Image src={languageIcon} alt="Language" width={47} height={40} unoptimized className="w-full h-full object-contain" />
        </div>
        <span className="text-sm mt-2 text-center">
          {course.CourseLocations.map((location, index) => (
            <React.Fragment key={index}>
              {location.locationOption}
              {index < course.CourseLocations.length - 1 && ' + '}
            </React.Fragment>
          ))}
        </span>
        <span className="text-sm mt-2 text-center">{t(course.language)}</span>
      </div>
      <div className="mt-16 justify-start">
        {course.CourseInstructors.map((instructor, index) => (
          <UserCard className="flex items-center mb-6" key={`instructor-${index}`} user={instructor.User} />
        ))}
      </div>
    </div>
  );
};
