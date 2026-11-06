import { FC, useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ColumnDef, Row } from '@tanstack/react-table';

import { DialogShell } from '../../../common/dialogs/DialogShell';
import TableGrid from '../../../common/TableGrid';
import { TableGridFilter } from '../../../common/TableGrid/types';
import { usePersistedPageSize } from '../../../common/TableGrid/hooks';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { SessionAttendances_Attendance } from '../../../../queries/__generated__/SessionAttendances';
import {
  MIN_ATTENDANCE_SHARE,
  assignRecordsToParticipants,
  attendanceLocationOption,
  attendanceShare,
  formatMinutes,
  formatPercent,
} from '../../../../helpers/attendanceDetails';

export type AttendanceRow = Record<string, unknown> & { id: number; _idx: string };

/**
 * Parses Session.attendanceData written by Python pandas
 * `DataFrame.to_json()` with the default `orient='columns'`, producing
 * `{ column: { rowIndex: value } }`. Accepts legacy "true" seed values
 * and malformed JSON gracefully (returns []).
 */
export const parseAttendanceData = (raw: string | null | undefined): AttendanceRow[] => {
  if (!raw || raw === 'true') return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [];
    }
    const cols = Object.keys(parsed);
    if (cols.length === 0) return [];

    const indexSet = new Set<string>();
    cols.forEach((col) => {
      const colObj = parsed[col];
      if (colObj && typeof colObj === 'object') {
        Object.keys(colObj).forEach((idx) => indexSet.add(idx));
      }
    });

    const indices = Array.from(indexSet);
    return indices.map((idx, i) => {
      // Build the row from the data columns first, then overwrite the
      // synthetic `id`/`_idx` to guarantee they survive even when the
      // attendance dataset itself contains an `id` column (e.g. Zoom
      // participant exports). TableGrid relies on a non-nullable `id`
      // because `getRowId` calls `row.id.toString()`.
      const row: AttendanceRow = { id: i, _idx: idx };
      cols.forEach((c) => {
        if (c === 'id' || c === '_idx') return;
        row[c] = parsed[c]?.[idx];
      });
      return row;
    });
  } catch {
    return [];
  }
};

/**
 * Coerces a raw attendance value to a millisecond timestamp.
 * Returns NaN when the value cannot be interpreted as a date.
 */
const toDateMs = (value: unknown): number => {
  if (value == null) return Number.NaN;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }
  return Number.NaN;
};

const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Places NaN entries last regardless of sort direction. TanStack inverts the
 * result for descending order, so the fallback keeps unparsable rows at the bottom.
 */
const compareNumeric = (a: number, b: number): number => {
  const aMissing = Number.isNaN(a);
  const bMissing = Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return a - b;
};

/** One Attendance Record as shown in the dialog. */
interface RecordRow {
  id: number;
  name: string;
  email: string;
  locationOption: string | null;
  location: string;
  joinMs: number;
  time: string;
  timeTitle: string;
  durationSeconds: number;
  duration: string;
  durationTitle: string;
  belowMinimum: boolean;
  assignedTo: string | null;
}

const isLocationOption = (value: string | null): value is LocationOption_enum =>
  value != null && (Object.values(LocationOption_enum) as string[]).includes(value);

interface AttendanceDataDialogProps {
  open: boolean;
  onClose: () => void;
  attendanceData: string | null;
  attendances: readonly SessionAttendances_Attendance[];
  sessionStart: string | null;
  sessionEnd: string | null;
  sessionTitle?: string;
}

const ASSIGNED = 'assigned';
const UNASSIGNED = 'unassigned';

const AttendanceDataDialog: FC<AttendanceDataDialogProps> = ({
  open,
  onClose,
  attendanceData,
  attendances,
  sessionStart,
  sessionEnd,
  sessionTitle,
}) => {
  const t = useTranslations('manageCourse.SessionsTab.attendance_data');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const rawRows = useMemo(() => parseAttendanceData(attendanceData), [attendanceData]);

  const rows = useMemo<RecordRow[]>(() => {
    const assignments = assignRecordsToParticipants(rawRows, attendances);
    const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
    const dateTimeFormat = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return rawRows.map((raw) => {
      const source = toText(raw.source);
      const place = toText(raw.location);
      const locationOption = attendanceLocationOption(source, place);
      const locationLabel = isLocationOption(locationOption) ? tCommon(`location.${locationOption}`) : locationOption ?? '';
      // Show the raw check-in place next to the mapped location (e.g. "Kiel · SK").
      const location =
        source !== 'ZOOM' && place && place !== locationLabel ? [locationLabel, place].filter(Boolean).join(' · ') : locationLabel;

      const joinMs = toDateMs(raw.joinDateTime);
      const leaveMs = toDateMs(raw.leaveDateTime);
      const time = [joinMs, leaveMs]
        .filter((ms) => !Number.isNaN(ms))
        .map((ms) => timeFormat.format(new Date(ms)))
        .join('–');
      const timeTitle = Number.isNaN(joinMs) ? '' : dateTimeFormat.format(new Date(joinMs));

      const seconds = toNumber(raw.duration);
      const share = attendanceShare(seconds, sessionStart, sessionEnd);
      const interruptions = toNumber(raw.interruptionCount);
      const duration = [formatMinutes(seconds), share != null ? `(${formatPercent(share)})` : null]
        .filter(Boolean)
        .join(' ');

      return {
        id: raw.id,
        name: toText(raw.name),
        email: toText(raw.email),
        locationOption,
        location,
        joinMs,
        time,
        timeTitle,
        durationSeconds: seconds ?? Number.NaN,
        duration,
        durationTitle: interruptions != null ? t('interruptions', { count: interruptions }) : '',
        belowMinimum: share != null && share < MIN_ATTENDANCE_SHARE,
        assignedTo: assignments[raw._idx] ?? null,
      };
    });
  }, [rawRows, attendances, locale, sessionStart, sessionEnd, t, tCommon]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('manageCourse.attendanceData', 15);
  const [searchFilter, setSearchFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<string[]>([]);

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    [setPageSize]
  );

  const handleSearchFilterChange = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const locationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      if (row.locationOption) counts.set(row.locationOption, (counts.get(row.locationOption) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: `${isLocationOption(value) ? tCommon(`location.${value}`) : value} (${count})`,
    }));
  }, [rows, tCommon]);

  const filters = useMemo<TableGridFilter[]>(() => {
    const result: TableGridFilter[] = [];
    if (locationOptions.length > 1) {
      result.push({
        id: 'location',
        label: t('filter_location'),
        options: locationOptions,
        selected: locationFilter,
        onChange: (selected) => {
          setLocationFilter(selected);
          setPageIndex(0);
        },
      });
    }
    result.push({
      id: 'assignment',
      label: t('filter_assignment'),
      options: [
        { value: ASSIGNED, label: t('assigned') },
        { value: UNASSIGNED, label: t('unassigned') },
      ],
      selected: assignmentFilter,
      onChange: (selected) => {
        setAssignmentFilter(selected);
        setPageIndex(0);
      },
    });
    return result;
  }, [assignmentFilter, locationFilter, locationOptions, t]);

  const filteredRows = useMemo(() => {
    const needle = searchFilter.trim().toLowerCase();
    return rows.filter((row) => {
      if (locationFilter.length > 0 && !locationFilter.includes(row.locationOption ?? '')) return false;
      if (assignmentFilter.length > 0 && !assignmentFilter.includes(row.assignedTo ? ASSIGNED : UNASSIGNED)) {
        return false;
      }
      if (!needle) return true;
      return [row.name, row.email, row.location, row.assignedTo ?? ''].some((value) =>
        value.toLowerCase().includes(needle)
      );
    });
  }, [rows, searchFilter, locationFilter, assignmentFilter]);

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => {
    const wrap = 'whitespace-normal break-words';
    return [
      {
        id: 'name',
        header: t('col_name'),
        accessorKey: 'name',
        size: 150,
        cell: ({ row }) => <span className={wrap}>{row.original.name}</span>,
      },
      {
        id: 'email',
        header: t('col_email'),
        accessorKey: 'email',
        size: 150,
        cell: ({ row }) => <span className={`${wrap} text-label-secondary`}>{row.original.email || '–'}</span>,
      },
      {
        id: 'location',
        header: t('col_location'),
        accessorKey: 'location',
        size: 110,
        cell: ({ row }) => <span className={wrap}>{row.original.location}</span>,
      },
      {
        id: 'time',
        header: t('col_time'),
        accessorFn: (row) => row.time,
        size: 110,
        sortingFn: (a: Row<RecordRow>, b: Row<RecordRow>) => compareNumeric(a.original.joinMs, b.original.joinMs),
        cell: ({ row }) => (
          <span className="tabular-nums" title={row.original.timeTitle}>
            {row.original.time}
          </span>
        ),
      },
      {
        id: 'duration',
        header: t('col_duration'),
        accessorFn: (row) => row.duration,
        size: 110,
        sortingFn: (a: Row<RecordRow>, b: Row<RecordRow>) =>
          compareNumeric(a.original.durationSeconds, b.original.durationSeconds),
        cell: ({ row }) =>
          row.original.duration ? (
            <span className={`${wrap} tabular-nums`} title={row.original.durationTitle || undefined}>
              {row.original.duration}
              {row.original.belowMinimum && (
                <span className="block text-xs text-label-secondary">{t('below_minimum')}</span>
              )}
            </span>
          ) : (
            <span className="text-label-secondary">–</span>
          ),
      },
      {
        id: 'assignedTo',
        header: t('col_assigned'),
        accessorFn: (row) => row.assignedTo ?? '',
        size: 150,
        cell: ({ row }) =>
          row.original.assignedTo ? (
            <span className={`${wrap} font-semibold`}>{row.original.assignedTo}</span>
          ) : (
            <span className="italic text-label-secondary">{t('not_assigned')}</span>
          ),
      },
    ];
  }, [t]);

  const renderMobileRow = useCallback(
    (row: RecordRow) => (
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-semibold text-label-primary">{row.name || row.email}</span>
        <span className="text-label-secondary">
          {[row.location, row.time, row.duration].filter(Boolean).join(' · ')}
        </span>
        <span className={row.assignedTo ? 'text-label-primary' : 'italic text-label-secondary'}>
          {row.assignedTo ? `${t('col_assigned')}: ${row.assignedTo}` : t('not_assigned')}
        </span>
      </div>
    ),
    [t]
  );

  const title = sessionTitle ? `${t('dialog_title')} – ${sessionTitle}` : t('dialog_title');

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      fullWidth
      ariaLabelledBy="attendance-data-dialog-title"
    >
      {rows.length === 0 ? (
        <div className="py-6 text-center text-label-secondary">{t('no_data')}</div>
      ) : (
        <TableGrid<RecordRow>
          data={filteredRows}
          columns={columns}
          loading={false}
          error={null}
          enablePagination
          totalCount={filteredRows.length}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchFilter={searchFilter}
          onSearchFilterChange={handleSearchFilterChange}
          showGlobalSearchField
          filters={filters}
          renderMobileRow={renderMobileRow}
          refetchQueries={[]}
          compactRows
        />
      )}
    </DialogShell>
  );
};

export default AttendanceDataDialog;
