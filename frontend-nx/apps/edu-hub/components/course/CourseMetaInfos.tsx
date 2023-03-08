import Image from 'next/image';
import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import {
  getEndTimeString,
  getStartTimeString,
  // getWeekdayString,
} from '../../helpers/dateHelpers';
import mysteryImg from '../../public/images/common/mystery.svg';
import languageIcon from '../../public/images/course/language.svg';
import pinIcon from '../../public/images/course/pin.svg';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseMetaInfos: FC<IProps> = ({ course }) => {
  const { t, lang } = useTranslation();
  const { t: tLanguage } = useTranslation('common');

  const startTime = getStartTimeString(course, lang);
  const endTime = getEndTimeString(course, lang);

  return (
    <div className="flex flex-1 flex-col justify-center items-center rounded-2xl lg:max-w-md bg-gray-100 p-12 sm:p-24">
      <div className="grid grid-cols-2 gap-x-28">
        <span className="text-lg mt-2 text-center">
          {course.weekDay != 'NONE' ? t(course.weekDay) : ''}
        </span>
        <span className="text-lg mt-2 text-center">
          {t('course-page:ects')}
        </span>
        <span className="text-sm mt-2 text-center mb-12">
          {course.weekDay !== 'NONE' && (
            <>
              {startTime}
              {endTime ? <span> - {endTime}</span> : ''}
            </>
          )}
        </span>
        <span className="text-sm mt-2 text-center">
          {t(`course-page:ects-${course.ects}`)}
        </span>
        <div className="flex justify-center">
          <Image src={pinIcon} alt="Location" width={32} height={43} />
        </div>
        <div className="flex justify-center">
          <Image src={languageIcon} alt="Language" width={47} height={40} />
        </div>
        <span className="text-sm mt-2 text-center">
          {course.CourseLocations.length > 2
            ? course.CourseLocations.map(
                (location) => `${location.locationOption} +`
              ).join('')
            : course.CourseLocations.map(
                (location) => `${location.locationOption}`
              ).join(' + ')}
        </span>
        <span className="text-sm mt-2 text-center">
          {tLanguage(course.language)}
        </span>
      </div>
      <div className="mt-16 justify-start">
        {course.CourseInstructors.map((instructor, index) => (
          <div key={`instructor-${index}`} className="flex items-center mb-6">
            <div className="flex flex-shrink-0 items-start mr-4">
              <Image
                src={instructor.Expert.User.picture || mysteryImg}
                alt="Image of the course instructor"
                width={100}
                height={100}
                className="rounded-full overflow-hidden"
                objectFit="cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg mb-1">
                {instructor.Expert.User.firstName}{' '}
                {instructor.Expert.User.lastName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
