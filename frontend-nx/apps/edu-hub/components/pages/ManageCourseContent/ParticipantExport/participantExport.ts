/**
 * Builds the participant exports of the manage-course page: a CSV for
 * spreadsheets and mail merge, and two print layouts (attendance list, name
 * tags) that the browser turns into paper or a PDF. Everything here is pure
 * except `downloadTextFile` and `printHtml`, which touch the DOM.
 */

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
