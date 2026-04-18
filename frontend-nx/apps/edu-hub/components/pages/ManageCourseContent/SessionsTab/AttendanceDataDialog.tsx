import { FC, useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ColumnDef, Row } from '@tanstack/react-table';

import { DialogShell } from '../../../common/dialogs/DialogShell';
import TableGrid from '../../../common/TableGrid';

export type AttendanceRow = Record<string, unknown> & { id: number; _idx: string };

const PREFERRED_COLUMN_ORDER = [
  'name',
  'email',
  'joinDateTime',
  'leaveDateTime',
  'duration',
  'interruptionCount',
  'source',
  'location',
];

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
      const row: AttendanceRow = { id: i, _idx: idx };
      cols.forEach((c) => {
        row[c] = parsed[c]?.[idx];
      });
      return row;
    });
  } catch {
    return [];
  }
};

const isDateTimeKey = (key: string) => key === 'joinDateTime' || key === 'leaveDateTime';
const isDurationKey = (key: string) => key === 'duration';

/**
 * Coerces a raw attendance value to a millisecond timestamp.
 * Returns NaN when the value cannot be interpreted as a date so callers can
 * decide how to order unparsable rows.
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

const toDurationSeconds = (value: unknown): number => {
  if (value == null || value === '') return Number.NaN;
  const seconds = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(seconds) ? seconds : Number.NaN;
};

const formatDateTime = (locale: string, value: unknown): string => {
  if (value == null) return '';
  const ms = toDateMs(value);
  if (Number.isNaN(ms)) return String(value);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
};

const formatDuration = (value: unknown): string => {
  const seconds = toDurationSeconds(value);
  if (Number.isNaN(seconds)) return value == null || value === '' ? '' : String(value);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatCellValue = (locale: string, key: string, value: unknown): string => {
  if (value == null) return '';
  if (isDateTimeKey(key)) return formatDateTime(locale, value);
  if (isDurationKey(key)) return formatDuration(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

/**
 * Compares two numeric values placing NaN entries last regardless of sort
 * direction. TanStack inverts the result for descending order, so returning a
 * direction-aware fallback keeps unparsable rows pinned to the bottom.
 */
const compareNumeric = (a: number, b: number): number => {
  const aMissing = Number.isNaN(a);
  const bMissing = Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return a - b;
};

const orderColumns = (keys: string[]): string[] => {
  const seen = new Set(keys);
  const ordered: string[] = [];
  PREFERRED_COLUMN_ORDER.forEach((key) => {
    if (seen.has(key)) {
      ordered.push(key);
      seen.delete(key);
    }
  });
  Array.from(seen).forEach((key) => ordered.push(key));
  return ordered;
};

interface AttendanceDataDialogProps {
  open: boolean;
  onClose: () => void;
  attendanceData: string | null;
  sessionTitle?: string;
}

const AttendanceDataDialog: FC<AttendanceDataDialogProps> = ({
  open,
  onClose,
  attendanceData,
  sessionTitle,
}) => {
  const t = useTranslations('manageCourse.SessionsTab.attendance_data');
  const locale = useLocale();

  const rows = useMemo(() => parseAttendanceData(attendanceData), [attendanceData]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [searchFilter, setSearchFilter] = useState('');

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const handleSearchFilterChange = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const columns = useMemo<ColumnDef<AttendanceRow>[]>(() => {
    if (rows.length === 0) return [];
    const keySet = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== 'id' && key !== '_idx') keySet.add(key);
      });
    });
    return orderColumns(Array.from(keySet)).map<ColumnDef<AttendanceRow>>((key) => {
      // Sort by the underlying raw value (chronological for dates, numeric for
      // durations) instead of the localized display string, which would
      // otherwise yield lexicographic ordering.
      let sortingFn: ColumnDef<AttendanceRow>['sortingFn'];
      if (isDateTimeKey(key)) {
        sortingFn = (rowA: Row<AttendanceRow>, rowB: Row<AttendanceRow>) =>
          compareNumeric(toDateMs(rowA.original[key]), toDateMs(rowB.original[key]));
      } else if (isDurationKey(key)) {
        sortingFn = (rowA: Row<AttendanceRow>, rowB: Row<AttendanceRow>) =>
          compareNumeric(toDurationSeconds(rowA.original[key]), toDurationSeconds(rowB.original[key]));
      }

      return {
        id: key,
        header: key,
        accessorFn: (row) => formatCellValue(locale, key, row[key]),
        enableSorting: true,
        size: isDateTimeKey(key) ? 170 : 140,
        cell: ({ getValue }) => <span>{String(getValue() ?? '')}</span>,
        ...(sortingFn ? { sortingFn } : {}),
      };
    });
  }, [rows, locale]);

  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return rows;
    const needle = searchFilter.toLowerCase();
    return rows.filter((row) =>
      Object.entries(row).some(([key, val]) => {
        if (key === 'id' || key === '_idx') return false;
        return formatCellValue(locale, key, val).toLowerCase().includes(needle);
      })
    );
  }, [rows, searchFilter, locale]);

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
        <TableGrid<AttendanceRow>
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
          refetchQueries={[]}
          compactRows
        />
      )}
    </DialogShell>
  );
};

export default AttendanceDataDialog;
