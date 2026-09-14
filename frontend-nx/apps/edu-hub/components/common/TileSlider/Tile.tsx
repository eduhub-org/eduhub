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
import { useEventTileMeta } from './eventTileMeta';

type CourseType = CourseList_Course | CoursesEnrolledByUser_Course | CourseTiles_Course;

interface TileProps {
  course: CourseType;
  isManage: boolean;
}

const TileComponent: FC<TileProps> = ({ course, isManage }) => {
  const t = useTranslations('common');
  const getWeekdayStartAndEndString = useWeekdayStartAndEndString();
  const eventMeta = useEventTileMeta(course);
  // An event is dated by its sessions, a course by its weekly slot; either way
  // this is one line and the language moved out of it into the footer.
  const dateLine = eventMeta.isEvent
    ? eventMeta.dateSpan
    : course.weekDay !== 'NONE' && course.startTime && course.endTime
    ? getWeekdayStartAndEndString(course, t)
    : null;

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
        cornerBadge={
          eventMeta.isPast ? (
            <span className="block rounded-full border border-border-primary bg-bg-secondary px-3 py-1 text-xs font-semibold text-label-secondary shadow-sm">
              {t('course_tile.past_event_badge')}
            </span>
          ) : null
        }
        bannerText={showExtendedApplicationBanner ? t('course_tile.extended_application_period_badge') : null}
      >
        {dateLine ? <div className="mb-3 text-sm tracking-wider text-label-primary">{dateLine}</div> : null}
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
          {/* The date line above is long enough on its own, so the language sits
              down here - and gives way to the program title, which is the more
              useful thing to know about an unpublished program. */}
          {!course.Program.published && course.Program.title ? (
            course.Program.title
          ) : course.language ? (
            <div className="flex items-center text-label-primary">
              <div className="w-3 h-3 mr-1">
                <Image src="/images/course/language.svg" alt="language icon" width={12} height={12} unoptimized className="w-full h-full object-contain" />
              </div>
              {t(course.language)}
            </div>
          ) : null}
        </div>
      </TileBase>
    </Link>
  );
};

export const Tile = memo(TileComponent);
