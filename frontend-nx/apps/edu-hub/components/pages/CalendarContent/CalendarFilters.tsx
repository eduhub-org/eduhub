import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { LocationOption_enum } from '../../../__generated__/globalTypes';
import { getLocationColor } from '../../../helpers/calendarColors';
import { SessionKind } from './calendarSessions';

export const LOCATIONS = [LocationOption_enum.KIEL, LocationOption_enum.HEIDE, LocationOption_enum.ONLINE] as const;

const KINDS: SessionKind[] = ['COURSES', 'EVENTS'];

const FilterChip: FC<{ active: boolean; onClick: () => void; children: ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-brand bg-bg-secondary text-label-primary'
        : 'border-border-primary text-label-secondary hover:border-brand'
    }`}
  >
    {children}
  </button>
);

const FilterGroup: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-label-disabled">{label}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

interface IProps {
  showKindFilter: boolean;
  kinds: SessionKind[];
  onToggleKind: (kind: SessionKind) => void;
  locations: string[];
  onToggleLocation: (location: string) => void;
  onClearLocations: () => void;
  courses: { id: number; title: string }[];
  courseIds: number[];
  onToggleCourse: (courseId: number) => void;
  onClearCourses: () => void;
}

// Filters double as the legend: each location chip carries its calendar colour and the events chip
// the dashed outline that event sessions get in the calendar.
const CalendarFilters: FC<IProps> = ({
  showKindFilter,
  kinds,
  onToggleKind,
  locations,
  onToggleLocation,
  onClearLocations,
  courses,
  courseIds,
  onToggleCourse,
  onClearCourses,
}) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-primary bg-bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:gap-10">
        {showKindFilter && (
          <FilterGroup label={t('calendar.filter_type')}>
            {KINDS.map((kind) => (
              <FilterChip key={kind} active={kinds.includes(kind)} onClick={() => onToggleKind(kind)}>
                <span
                  className={`h-3 w-3 rounded border-2 border-label-secondary ${
                    kind === 'EVENTS' ? 'border-dashed' : ''
                  }`}
                  aria-hidden
                />
                {t(kind === 'EVENTS' ? 'calendar.filter_events' : 'calendar.filter_courses')}
              </FilterChip>
            ))}
          </FilterGroup>
        )}
        <FilterGroup label={t('calendar.filter_location')}>
          <FilterChip active={locations.length === 0} onClick={onClearLocations}>
            {t('calendar.filter_location_all')}
          </FilterChip>
          {LOCATIONS.map((location) => (
            <FilterChip key={location} active={locations.includes(location)} onClick={() => onToggleLocation(location)}>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getLocationColor(location).border }}
                aria-hidden
              />
              {t(`common.location.${location}`)}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>
      {courses.length > 0 && (
        <FilterGroup label={t('calendar.filter_course')}>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
            <FilterChip active={courseIds.length === 0} onClick={onClearCourses}>
              {t('calendar.filter_course_all')}
            </FilterChip>
            {courses.map((course) => (
              <FilterChip
                key={course.id}
                active={courseIds.includes(course.id)}
                onClick={() => onToggleCourse(course.id)}
              >
                <span className="max-w-[16rem] truncate">{course.title}</span>
              </FilterChip>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
};

export default CalendarFilters;
