import Image from 'next/image';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('common'); // used to get weekday and language
  const tCourse = useTranslations('course');

  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();

  const startTime = getStartTimeString(course.startTime);
  const endTime = getEndTimeString(course.endTime);

  // Get ECTS translation for the specific course ECTS value
  const getEctsTranslation = (ectsValue: string) => {
    try {
      // Convert values with dots/commas to valid translation keys
      const normalizedKey = ectsValue
        .replace('.', 'dot')
        .replace(',', '_');
      
      // Try the translation key
      const translatedValue = tCourse(`ects.${normalizedKey}`);
      
      // Check if the translation actually worked (next-intl returns the key if translation is missing)
      if (translatedValue === `ects.${normalizedKey}`) {
        // If translation key is returned, fallback to original value
        return ectsValue;
      }
      
      return translatedValue;
    } catch (error) {
      return ectsValue; // fallback to original value
    }
  };

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
        <span className="text-sm mt-2 text-center">{getEctsTranslation(course.ects)}</span>
        <div className="flex justify-center">
          <Image src={pinIcon} alt="Location" width={32} height={43} />
        </div>
        <div className="flex justify-center">
          <Image src={languageIcon} alt="Language" width={47} height={40} />
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
          <UserCard className="flex items-center mb-6" key={`instructor-${index}`} user={instructor.Expert.User} />
        ))}
      </div>
    </div>
  );
};
