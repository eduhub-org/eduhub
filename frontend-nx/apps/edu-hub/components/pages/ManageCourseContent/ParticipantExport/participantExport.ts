/**
 * Builds the participant exports of the manage-course page: a CSV for
 * spreadsheets and mail merge, and two print layouts (attendance list, name
 * tags) that the browser turns into paper or a PDF. Everything here is pure
 * except `downloadTextFile` and `printHtml`, which touch the DOM.
 */

import { formatInTimeZone } from 'date-fns-tz';
import { AttendanceStatus_enum } from '../../../../__generated__/globalTypes';

export interface ExportParticipant {
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  status: string;
}

interface EnrollmentLike {
  status: string;
  User: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    organizationName?: string | null;
    Organization?: { name: string | null } | null;
  };
}

/** A linked Organization wins; the free text (e.g. from guests) is the fallback. */
export const toExportParticipants = (enrollments: EnrollmentLike[]): ExportParticipant[] =>
  enrollments.map(({ status, User }) => ({
    firstName: User.firstName ?? '',
    lastName: User.lastName ?? '',
    organization: User.Organization?.name || User.organizationName || '',
    email: User.email ?? '',
    status,
  }));

/* -------------------------------------------------------------------- CSV */

// Values starting with these are run as formulas by spreadsheet apps. Guests
// fill in names and organizations without an account, so a cell like
// `=HYPERLINK(...)` must stay text.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const csvCell = (value: string, delimiter: string): string => {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return safe.includes(delimiter) || /["\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/**
 * RFC 4180 CSV with a UTF-8 byte order mark, so Excel shows umlauts correctly.
 * German Excel splits on `;`, English Excel on `,` - hence the parameter.
 */
export const buildCsv = (rows: string[][], delimiter: ',' | ';'): string =>
  '﻿' + rows.map((row) => row.map((cell) => csvCell(cell, delimiter)).join(delimiter)).join('\r\n') + '\r\n';

/* ------------------------------------------------------ attendance CSV */

// German exports write 14.10.2026, English ones 2026-10-14. Uploads accept both.
const DAY_IN_HEADER = /(\d{1,2})\.(\d{1,2})\.(\d{4})|(\d{4})-(\d{2})-(\d{2})/;

/** The date part of a day column's header ("Anwesend 14.10.2026"). */
export const attendanceDayLabel = (dayStart: Date, timeZone: string, locale: string): string =>
  formatInTimeZone(dayStart, timeZone, locale === 'de' ? 'dd.MM.yyyy' : 'yyyy-MM-dd');

/** "yyyy-MM-dd" from a header holding a German or ISO date, else null. */
export const dayKeyFromHeader = (header: string): string | null => {
  const match = DAY_IN_HEADER.exec(header);
  if (!match) return null;
  const [year, month, day] = match[1] ? [match[3], match[2], match[1]] : [match[4], match[5], match[6]];
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Splits CSV text into rows of cells: strips the byte order mark, detects `;`
 * or `,` from the header line, handles RFC 4180 quoting and drops the `'` that
 * `buildCsv` puts in front of formula-like values.
 */
export const parseCsv = (text: string): string[][] => {
  const content = text.replace(/^\uFEFF/, '');
  const headerLine = content.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (headerLine.match(/;/g)?.length ?? 0) > (headerLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const unescape = (value: string) => (/^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value);
  return rows
    .map((cells) => cells.map(unescape))
    .filter((cells) => cells.some((value) => value.trim() !== ''));
};

const ATTENDED_VALUES = ['x', 'ja', 'yes', 'y', 'j', '1', 'true', 'wahr', '✓', '✔', '☑', 'anwesend', 'present'];
const MISSED_VALUES = ['', 'nein', 'no', 'n', '0', 'false', 'falsch', '-', 'abwesend', 'absent'];

/** Attended or missed for a spreadsheet cell (empty means missed), null if unreadable. */
export const parseAttendanceCell = (value: string): AttendanceStatus_enum | null => {
  const normalized = value.trim().toLowerCase();
  if (ATTENDED_VALUES.includes(normalized)) return AttendanceStatus_enum.ATTENDED;
  if (MISSED_VALUES.includes(normalized)) return AttendanceStatus_enum.MISSED;
  return null;
};

export interface ParsedAttendanceRow {
  /** 1-based line in the file, for error messages. */
  line: number;
  email: string;
  statusByDay: Record<string, AttendanceStatus_enum>;
}

export interface ParsedAttendanceCsv {
  hasEmailColumn: boolean;
  dayColumns: { header: string; dayKey: string }[];
  rows: ParsedAttendanceRow[];
  invalidCells: { line: number; header: string; value: string }[];
}

const isEmailHeader = (header: string) =>
  ['email', 'emailadresse', 'emailaddress'].includes(header.toLowerCase().replace(/[^a-z]/g, ''));

/** Reads the email column and every column whose header carries a date. */
export const parseAttendanceCsv = (rows: string[][]): ParsedAttendanceCsv => {
  const [header = [], ...body] = rows;
  const emailIndex = header.findIndex(isEmailHeader);
  const dayColumns = header
    .map((title, index) => ({ header: title.trim(), index, dayKey: dayKeyFromHeader(title) }))
    .filter((column): column is { header: string; index: number; dayKey: string } => column.dayKey !== null);

  const result: ParsedAttendanceCsv = {
    hasEmailColumn: emailIndex >= 0,
    dayColumns: dayColumns.map(({ header: title, dayKey }) => ({ header: title, dayKey })),
    rows: [],
    invalidCells: [],
  };
  if (emailIndex < 0) return result;

  body.forEach((cells, rowIndex) => {
    const line = rowIndex + 2;
    const email = (cells[emailIndex] ?? '').trim().toLowerCase();
    if (!email) return;
    const statusByDay: Record<string, AttendanceStatus_enum> = {};
    for (const column of dayColumns) {
      const value = cells[column.index] ?? '';
      const status = parseAttendanceCell(value);
      if (status === null) {
        result.invalidCells.push({ line, header: column.header, value });
      } else {
        statusByDay[column.dayKey] = status;
      }
    }
    result.rows.push({ line, email, statusByDay });
  });

  return result;
};

/* ------------------------------------------------------------ print views */

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const printDocument = (title: string, style: string, body: string, lang: string): string => `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: Helvetica, Arial, sans-serif; color: #000; background: #fff; }
${style}
</style>
</head>
<body>${body}</body>
</html>`;

export interface AttendanceListLabels {
  number: string;
  lastName: string;
  firstName: string;
  organization: string;
  present: string;
  signature: string;
  count: string;
}

export const buildAttendanceListHtml = ({
  courseTitle,
  subtitle,
  participants,
  labels,
  lang,
}: {
  courseTitle: string;
  subtitle: string;
  participants: ExportParticipant[];
  labels: AttendanceListLabels;
  lang: string;
}): string => {
  const rows = participants
    .map(
      (p, index) => `<tr>
<td class="num">${index + 1}</td>
<td>${escapeHtml(p.lastName)}</td>
<td>${escapeHtml(p.firstName)}</td>
<td>${escapeHtml(p.organization)}</td>
<td class="box"><span></span></td>
<td></td>
</tr>`
    )
    .join('\n');

  const style = `
@page { size: A4 portrait; margin: 15mm 12mm; }
h1 { font-size: 16pt; margin: 0 0 2mm; }
p.meta { font-size: 10pt; margin: 0 0 5mm; }
/* Every cell draws its own right and bottom edge, so each row keeps its lines when the table breaks
   across pages (collapsed borders straddle the cell edge and get lost there). Chromium clips a
   frame line that ends exactly at the page edge, hence the table stays a hair narrower. */
table { width: calc(100% - 0.5mm); border-collapse: separate; border-spacing: 0; font-size: 10pt; }
thead { display: table-header-group; }
th, td { border-right: 0.3mm solid #000; border-bottom: 0.3mm solid #000; padding: 2mm; text-align: left;
  vertical-align: middle; }
th { border-top: 0.3mm solid #000; background: #eee; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
th:first-child, td:first-child { border-left: 0.3mm solid #000; }
tr { break-inside: avoid; height: 10mm; }
td.num { width: 8mm; text-align: right; }
td.box { width: 18mm; text-align: center; }
td.box span { display: inline-block; width: 5mm; height: 5mm; border: 0.3mm solid #000; }
th.signature { width: 45mm; }
`;

  const body = `<h1>${escapeHtml(courseTitle)}</h1>
<p class="meta">${escapeHtml([subtitle, labels.count].filter(Boolean).join(' · '))}</p>
<table>
<thead><tr>
<th>${escapeHtml(labels.number)}</th>
<th>${escapeHtml(labels.lastName)}</th>
<th>${escapeHtml(labels.firstName)}</th>
<th>${escapeHtml(labels.organization)}</th>
<th>${escapeHtml(labels.present)}</th>
<th class="signature">${escapeHtml(labels.signature)}</th>
</tr></thead>
<tbody>
${rows}
</tbody>
</table>`;

  return printDocument(courseTitle, style, body, lang);
};

/**
 * Name tags, 2 x 4 per A4 sheet at 90 x 55 mm (the usual badge-holder insert).
 * Dashed borders double as cutting lines.
 */
export const buildNameTagsHtml = ({
  courseTitle,
  participants,
  lang,
}: {
  courseTitle: string;
  participants: ExportParticipant[];
  lang: string;
}): string => {
  const tags = participants
    .map(
      (p) => `<div class="tag">
<div class="first">${escapeHtml(p.firstName)}</div>
<div class="last">${escapeHtml(p.lastName)}</div>
${p.organization ? `<div class="org">${escapeHtml(p.organization)}</div>` : ''}
<div class="event">${escapeHtml(courseTitle)}</div>
</div>`
    )
    .join('\n');

  const style = `
@page { size: A4 portrait; margin: 13mm 15mm; }
.sheet { display: grid; grid-template-columns: repeat(2, 90mm); grid-auto-rows: 55mm; justify-content: center; }
.tag { border: 0.2mm dashed #999; padding: 6mm; display: flex; flex-direction: column; justify-content: center;
  text-align: center; overflow: hidden; break-inside: avoid; position: relative; }
.first { font-size: 22pt; font-weight: bold; line-height: 1.1; }
.last { font-size: 14pt; margin-top: 1mm; }
.org { font-size: 11pt; margin-top: 3mm; color: #333; }
.event { font-size: 7pt; color: #666; position: absolute; left: 0; right: 0; bottom: 3mm; }
`;

  return printDocument(courseTitle, style, `<div class="sheet">${tags}</div>`, lang);
};

/* -------------------------------------------------------------- DOM side */

export const exportFileName = (courseTitle: string, suffix: string, extension: string, date = new Date()): string => {
  const slug =
    courseTitle
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'course';
  return `${slug}-${suffix}-${date.toISOString().slice(0, 10)}.${extension}`;
};

export const downloadTextFile = (content: string, fileName: string, mimeType: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

/**
 * Prints through a hidden iframe rather than a new window: the data arrives
 * after an await, by which point a popup would be blocked.
 */
export const printHtml = (html: string): void => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    iframe.remove();
    return;
  }
  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  const cleanUp = () => setTimeout(() => iframe.remove(), 0);
  frameWindow.addEventListener('afterprint', cleanUp, { once: true });
  frameWindow.focus();
  frameWindow.print();
};
