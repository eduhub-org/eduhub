import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@mui/material';
import { MdErrorOutline, MdPlace, MdVideocam } from 'react-icons/md';

import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import {
  ManagedCourse_Course_by_pk_CourseLocations,
  ManagedCourse_Course_by_pk_Program_Sessions,
  ManagedCourse_Course_by_pk_Sessions,
  ManagedCourse_Course_by_pk_Sessions_SessionAddresses,
} from '../../../../queries/__generated__/ManagedCourse';
import { isProgramSession } from '../../../../helpers/programSessions';

type SessionRow = ManagedCourse_Course_by_pk_Sessions | ManagedCourse_Course_by_pk_Program_Sessions;

/** One place a session takes place in; `address` is null when the session has no row for it yet. */
export interface SessionLocationEntry {
  key: string;
  option: LocationOption_enum;
  courseLocationId: number | null;
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
}

const locationOrder = Object.values(LocationOption_enum);
const byLocationOrder = (a: LocationOption_enum, b: LocationOption_enum) =>
  locationOrder.indexOf(a) - locationOrder.indexOf(b);

/**
 * A course session belongs in every location of its course. Listing the course locations (rather
 * than the session's address rows) surfaces locations the session has no address row for, which
 * the tab otherwise could not show or fix. Program sessions carry their own locations.
 */
export const sessionLocationEntries = (
  session: SessionRow,
  courseLocations: ManagedCourse_Course_by_pk_CourseLocations[]
): SessionLocationEntry[] => {
  if (isProgramSession(session)) {
    return session.SessionAddresses.map((address) => ({
      key: `sa-${address.id}`,
      option: address.locationOption ?? LocationOption_enum.ONLINE,
      courseLocationId: null,
      address,
    })).sort((a, b) => byLocationOrder(a.option, b.option));
  }
  return courseLocations
    .map((location) => ({
      key: `cl-${location.id}`,
      option: location.locationOption ?? LocationOption_enum.ONLINE,
      courseLocationId: location.id,
      address: session.SessionAddresses.find((address) => address.CourseLocation?.id === location.id) ?? null,
    }))
    .sort((a, b) => byLocationOrder(a.option, b.option));
};

export const LocationIcon: FC<{ option: LocationOption_enum; className?: string }> = ({ option, className }) =>
  option === LocationOption_enum.ONLINE ? (
    <MdVideocam className={className} aria-hidden />
  ) : (
    <MdPlace className={className} aria-hidden />
  );

/**
 * Compact location summary for a session row: a grey chip per location. With `iconsOnly` the
 * label moves into the tooltip; a missing address row is flagged in amber.
 */
export const SessionLocationChips: FC<{ entries: SessionLocationEntry[]; iconsOnly?: boolean }> = ({
  entries,
  iconsOnly = false,
}) => {
  const tCommon = useTranslations('common');
  const t = useTranslations('manageCourse.SessionsTab');

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      {entries.map((entry) => {
        const label = tCommon(`location.${entry.option}`);
        const address = entry.address?.address || entry.address?.CourseLocation?.defaultSessionAddress || '';
        return (
          <Tooltip key={entry.key} title={entry.address ? [label, address].filter(Boolean).join(' · ') : label}>
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-bg-secondary text-label-secondary text-xs ${
                iconsOnly ? 'p-1.5' : 'px-2 py-0.5'
              }`}
            >
              <LocationIcon option={entry.option} />
              {!iconsOnly && <span>{label}</span>}
              {!entry.address && (
                <MdErrorOutline className="text-amber-700" aria-label={t('no_address')} />
              )}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
};
