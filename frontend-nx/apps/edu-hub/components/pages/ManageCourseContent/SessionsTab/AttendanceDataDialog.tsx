import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

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

const formatDateTime = (value: unknown): string => {
  if (value == null) return '';
  let date: Date | null = null;
  if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    const numeric = Number(value);
    date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
  }
  if (!date || Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDuration = (value: unknown): string => {
  if (value == null || value === '') return '';
  const seconds = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(seconds)) return String(value);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatCellValue = (key: string, value: unknown): string => {
  if (value == null) return '';
  if (isDateTimeKey(key)) return formatDateTime(value);
  if (key === 'duration') return formatDuration(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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
    return orderColumns(Array.from(keySet)).map<ColumnDef<AttendanceRow>>((key) => ({
      id: key,
      header: key,
      accessorFn: (row) => formatCellValue(key, row[key]),
      enableSorting: true,
      size: isDateTimeKey(key) ? 170 : 140,
      cell: ({ getValue }) => <span>{String(getValue() ?? '')}</span>,
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return rows;
    const needle = searchFilter.toLowerCase();
    return rows.filter((row) =>
      Object.entries(row).some(([key, val]) => {
        if (key === 'id' || key === '_idx') return false;
        return formatCellValue(key, val).toLowerCase().includes(needle);
      })
    );
  }, [rows, searchFilter]);

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
