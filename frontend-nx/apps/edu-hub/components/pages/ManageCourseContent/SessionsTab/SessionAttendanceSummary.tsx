import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { MANUAL_ATTENDANCE_LOCATION, SessionAttendanceSummary as Summary } from '../../../../helpers/attendanceDetails';
import { LocationIcon } from './SessionLocations';

interface Props {
  summary: Summary;
  /** Locations the session takes place in; the per-location line only shows for more than one. */
  locationOptions: LocationOption_enum[];
  /** Table-cell variant: smaller type, locations as one line of text. */
  compact?: boolean;
}

const isLocationOption = (value: string): value is LocationOption_enum =>
  (Object.values(LocationOption_enum) as string[]).includes(value);

/** "41 / 60 anwesend" and, for hybrid sessions, "Online 23 · Kiel 16 · manuell 2". */
export const SessionAttendanceSummary: FC<Props> = ({ summary, locationOptions, compact = false }) => {
  const t = useTranslations('manageCourse.SessionsTab.attendance_data');
  const tCommon = useTranslations('common');

  const locationOrder: string[] = [...locationOptions];
  const entries = Object.entries(summary.byLocation)
    .filter(([location, count]) => count > 0 && location !== MANUAL_ATTENDANCE_LOCATION)
    .sort(([a], [b]) => {
      const ia = locationOrder.indexOf(a);
      const ib = locationOrder.indexOf(b);
      return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
    });
  const manualCount = summary.byLocation[MANUAL_ATTENDANCE_LOCATION] ?? 0;
  const showBreakdown = locationOptions.length > 1 && (entries.length > 0 || manualCount > 0);
  const locationLabel = (location: string) => (isLocationOption(location) ? tCommon(`location.${location}`) : location);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-semibold tabular-nums text-label-primary">
          {t('attended_of_total', { attended: summary.attended, total: summary.total })}
        </span>
        {showBreakdown && (
          <span className="text-xs text-label-secondary">
            {[
              // Non-breaking spaces keep each label with its count when the cell wraps.
              ...entries.map(([location, count]) => `${locationLabel(location)}\u00a0${count}`),
              ...(manualCount > 0 ? [`${t('manual')}\u00a0${manualCount}`] : []),
            ].join(' · ')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-label-primary">
        <span className="text-xl font-semibold tabular-nums">
          {t('attended_of_total', { attended: summary.attended, total: summary.total })}
        </span>
      </p>
      {showBreakdown && (
        <ul className="flex flex-wrap items-center gap-1.5 text-sm text-label-secondary" aria-label={t('filter_location')}>
          {entries.map(([location, count]) => (
            <li key={location} className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2.5 py-0.5">
              {isLocationOption(location) && <LocationIcon option={location} className="shrink-0" />}
              <span>{isLocationOption(location) ? tCommon(`location.${location}`) : location}</span>
              <span className="font-semibold text-label-primary tabular-nums">{count}</span>
            </li>
          ))}
          {manualCount > 0 && (
            <li className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2.5 py-0.5">
              <span>{t('manual')}</span>
              <span className="font-semibold text-label-primary tabular-nums">{manualCount}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
