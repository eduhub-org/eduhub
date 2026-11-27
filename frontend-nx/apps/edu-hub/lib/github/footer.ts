/**
 * The footer EduHub keeps at the end of a report's issue: report id, priority and people affected,
 * never a name, email or user id. Free of server-only imports, so the admin dialog can preview it.
 * functions/callNodeFunction/lib/github.js has a copy for the nightly reconcile.
 */

export const FOOTER_START = '<!-- eduhub-report:start -->';
export const FOOTER_END = '<!-- eduhub-report:end -->';

export interface FooterData {
  reportId: number;
  priority: string | null;
  people: number;
}

/** No names, emails or user ids: only what the team needs to prioritise. */
export const renderFooter = ({ reportId, priority, people }: FooterData) =>
  [
    FOOTER_START,
    '---',
    `EduHub report #${reportId} · priority: ${priority ? priority.toLowerCase() : 'not set'} · ${people} ${
      people === 1 ? 'person' : 'people'
    } affected`,
    '',
    '<sub>Sent through the EduHub Assistant and approved by an admin. This footer is updated automatically.</sub>',
    FOOTER_END,
  ].join('\n');

/** Replaces the footer, or appends it to an issue that has none (a linked existing issue). */
export const withFooter = (body: string | null, footer: string) => {
  const text = body ?? '';
  const start = text.indexOf(FOOTER_START);
  const end = text.indexOf(FOOTER_END);
  if (start >= 0 && end > start) return `${text.slice(0, start)}${footer}${text.slice(end + FOOTER_END.length)}`;
  return text.trim() ? `${text.trimEnd()}\n\n${footer}` : footer;
};

/** The footer as GitHub shows it: its text lines, without the markers and the rule. */
export const visibleFooter = (data: FooterData) =>
  renderFooter(data)
    .split('\n')
    .filter((line) => line && line !== '---' && !line.startsWith('<!--'))
    .map((line) => line.replace(/<\/?sub>/g, ''));
