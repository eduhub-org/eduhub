import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { LocationOption_enum } from '../../../__generated__/globalTypes';
import { getLocationColor } from '../../../helpers/calendarColors';
import TagSelector from '../../inputs/TagSelector';
import { Publication, SessionKind } from './calendarSessions';

export const LOCATIONS = [LocationOption_enum.KIEL, LocationOption_enum.HEIDE, LocationOption_enum.ONLINE] as const;

const KINDS: SessionKind[] = ['COURSES', 'EVENTS'];
const PUBLICATIONS: Publication[] = ['PUBLISHED', 'UNPUBLISHED'];

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

type Tag = { id: number; name: string };

interface IProps {
  showKindFilter: boolean;
  kinds: SessionKind[];
  onToggleKind: (kind: SessionKind) => void;
  publication: Publication[];
  onTogglePublication: (publication: Publication) => void;
  locations: string[];
  onToggleLocation: (location: string) => void;
  onClearLocations: () => void;
  courseOptions: Tag[];
  courses: Tag[];
  onCoursesChange: (courses: Tag[]) => void;
  addressOptions: Tag[];
  addresses: Tag[];
  onAddressesChange: (addresses: Tag[]) => void;
}

// Filters double as the legend: each location chip carries its calendar colour and the events chip
// the dashed outline that event sessions get in the calendar. Courses and addresses are too many for
// chips, so they are picked by typing in a tag selector.
const CalendarFilters: FC<IProps> = ({
  showKindFilter,
  kinds,
  onToggleKind,
  publication,
  onTogglePublication,
  locations,
  onToggleLocation,
  onClearLocations,
  courseOptions,
  courses,
  onCoursesChange,
  addressOptions,
  addresses,
  onAddressesChange,
}) => {
  const t = useTranslations();

  return (
    <div className="light flex flex-col gap-5 rounded-2xl border border-border-primary bg-fill-primary p-4 text-label-primary shadow-lg sm:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:gap-x-10">
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
        <FilterGroup label={t('calendar.filter_publication')}>
          {PUBLICATIONS.map((state) => (
            <FilterChip key={state} active={publication.includes(state)} onClick={() => onTogglePublication(state)}>
              {t(`calendar.filter_publication_${state.toLowerCase()}`)}
            </FilterChip>
          ))}
        </FilterGroup>
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
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {/* TagSelector also renders a snackbar next to its input; keep both in one grid cell. */}
        <div>
          <TagSelector
            variant="material"
            label={t('calendar.filter_course')}
            placeholder={courses.length === 0 ? t('calendar.filter_course_placeholder') : ''}
            itemId={0}
            values={courses}
            options={courseOptions}
            onValueUpdated={onCoursesChange}
          />
        </div>
        <div>
          <TagSelector
            variant="material"
            label={t('calendar.filter_address')}
            placeholder={addresses.length === 0 ? t('calendar.filter_address_placeholder') : ''}
            itemId={0}
            values={addresses}
            options={addressOptions}
            onValueUpdated={onAddressesChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;
