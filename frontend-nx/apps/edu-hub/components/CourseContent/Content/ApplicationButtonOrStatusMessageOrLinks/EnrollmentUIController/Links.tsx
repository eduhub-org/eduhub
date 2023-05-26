import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Button } from '../../../../common/Button';

import { Course_Course_by_pk } from '../../../../../queries/__generated__/Course';
interface IProps {
  course: Course_Course_by_pk;
}

export const CourseLinkInfos: FC<IProps> = ({ course }) => {
  const { t } = useTranslation();

  const onlineLocation = course.CourseLocations.find(
    (location) => location.locationOption === 'ONLINE'
  );

  return (
    <div className="flex justify-center items-center">
      {onlineLocation && onlineLocation.defaultSessionAddress && (
        <div className="mx-4">
          {/* <a
            href={onlineLocation.defaultSessionAddress}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white inline-block max-w-[100px]"
          >
            {t('course-page:to-online-meeting')}
          </a> */}
          <Button
            as="a"
            href={onlineLocation.defaultSessionAddress}
            filled
            inverted
            // className="bg-edu-course-current"
          >
            {t('course-page:to-online-meeting')}
          </Button>
        </div>
      )}{' '}
      <div className="mx-4">
        <Button
          as="a"
          href={course.chatLink}
          filled
          inverted
          // className="bg-edu-course-current"
        >
          {t('course-page:to-chat')}
        </Button>
      </div>
    </div>
  );
};
