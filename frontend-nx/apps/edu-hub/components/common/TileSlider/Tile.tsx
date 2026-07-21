import Image from 'next/image';
import Link from 'next/link';
import { FC, memo } from 'react';
import { useTranslations } from 'next-intl';
import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CoursesEnrolledByUser_Course } from '../../../queries/__generated__/CoursesEnrolledByUser';
import { CourseTiles_Course } from '../../../queries/__generated__/CourseTiles';
import {
  useWeekdayStartAndEndString,
} from '../../../helpers/dateTimeHelpers';
import React from 'react';
import { TileBase } from './TileBase';
import { shouldShowExtendedApplicationBanner } from './extendedApplicationBanner';

type CourseType = CourseList_Course | CoursesEnrolledByUser_Course | CourseTiles_Course;

interface TileProps {
  course: CourseType;
  isManage: boolean;
}

const TileComponent: FC<TileProps> = ({ course, isManage }) => {
  const t = useTranslations('common');
  const getWeekdayStartAndEndString = useWeekdayStartAndEndString();
  const showExtendedApplicationBanner = shouldShowExtendedApplicationBanner(
    course.applicationEnd ? new Date(course.applicationEnd) : null,
    course.Program.defaultApplicationEnd ? new Date(course.Program.defaultApplicationEnd) : null,
    Boolean(course.Program.showExtendedApplicationPeriodBanner)
  );

  return (
    <Link href={isManage ? `/manage/course/${course.id}` : `/course/${course.id}`}>
      <TileBase
        coverImage={course?.coverImage ?? null}
        title={course.title}
        bannerText={showExtendedApplicationBanner ? t('course_tile.extended_application_period_badge') : null}
      >
        <div className="flex justify-between mb-3 text-sm tracking-wider text-label-primary">
          {course.weekDay !== 'NONE' && course.startTime && course.endTime
            ? getWeekdayStartAndEndString(course, t)
            : null}{' '}
          <div className="flex items-center text-label-primary">
            <div className="w-4 h-4 mr-1">
              <Image src="/images/course/language.svg" alt="language icon" width={16} height={16} unoptimized className="w-full h-full object-contain" />
            </div>
            {t(course.language ?? '')}
          </div>
        </div>
        <span className="text-lg mb-auto line-clamp-3 text-label-primary">{course.tagline}</span>
        <div className="flex justify-between text-xs items-center tracking-wider text-label-primary">
          <div className="flex uppercase text-label-primary">
            <div className="w-3 h-3 mr-1">
              <Image src="/images/course/pin.svg" alt="location icon" width={12} height={12} unoptimized className="w-full h-full object-contain" />
            </div>
            {course.CourseLocations.map((location, index) => (
              <React.Fragment key={index}>
                {location.locationOption}
                {index < course.CourseLocations.length - 1 && ' + '}
              </React.Fragment>
            ))}
          </div>
          {!course.Program.published && course.Program.title}
        </div>
      </TileBase>
    </Link>
  );
};

export const Tile = memo(TileComponent);
