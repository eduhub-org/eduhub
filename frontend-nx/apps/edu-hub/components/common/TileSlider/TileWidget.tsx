import Image from 'next/image';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CoursesEnrolledByUser_Course } from '../../../queries/__generated__/CoursesEnrolledByUser';
import { CourseTiles_Course } from '../../../queries/__generated__/CourseTiles';
import {
  useWeekdayStartAndEndString,
} from '../../../helpers/dateTimeHelpers';
import React from 'react';
import { TileBase } from './TileBase';

type CourseType = CourseList_Course | CoursesEnrolledByUser_Course | CourseTiles_Course;

interface TileWidgetProps {
  course: CourseType;
}

/**
 * Get the base URL for the EduHub application based on environment
 * Uses NEXT_PUBLIC_BASE_URL if set, otherwise uses window.location.origin when on EduHub domain
 */
const getBaseUrl = (): string => {
  // Check for explicit base URL environment variable (client-side accessible)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Client-side: Use current origin (works when widget is served from EduHub domain)
  // This will be correct for development, staging, and production
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side fallback (shouldn't happen in widget, but safe fallback)
  // This would only be used during SSR, which shouldn't happen for widget
  return process.env.NEXTAUTH_URL || 'https://edu.opencampus.sh';
};

export const TileWidget: FC<TileWidgetProps> = ({ course }) => {
  const t = useTranslations('common');
  const getWeekdayStartAndEndString = useWeekdayStartAndEndString();

  const baseUrl = getBaseUrl();
  const courseUrl = `${baseUrl}/course/${course.id}`;

  return (
    <a href={courseUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
      <TileBase 
        coverImage={course?.coverImage ?? null} 
        title={course.title} 
        className="shadow-lg"
        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex justify-between mb-3 text-sm tracking-wider">
          {course.weekDay !== 'NONE' && course.startTime && course.endTime
            ? getWeekdayStartAndEndString(course, t)
            : null}{' '}
          <div className="flex items-center">
            <div className="w-4 h-4 mr-1">
              <Image src="/images/course/language.svg" alt="language icon" width={16} height={16} unoptimized className="w-full h-full object-contain" />
            </div>
            {t(course.language ?? '')}
          </div>
        </div>
        <span className="text-lg mb-auto line-clamp-3">{course.tagline}</span>
        <div className="flex justify-between text-xs items-center tracking-wider">
          <div className="flex uppercase">
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
    </a>
  );
};

