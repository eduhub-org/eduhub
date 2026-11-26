import { FC, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { ISSUE_REPORT_SUMMARIES } from '../../../queries/issueReports';
import { IssueReportSummaries } from '../../../queries/__generated__/IssueReportSummaries';

/**
 * The weekly summaries the generate_issue_report_summary cron writes (issue #2234), always in
 * English: the latest open, earlier weeks to pick from.
 */
export const WeeklySummaries: FC = () => {
  const t = useTranslations('manageReports.summary');
  const locale = useLocale();
  const { data, loading } = useAdminQuery<IssueReportSummaries>(ISSUE_REPORT_SUMMARIES);
  const summaries = data?.IssueReportSummary ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = summaries.find((s) => s.id === selectedId) ?? summaries[0];

  const date = (value: string) => new Date(value).toLocaleDateString(locale);

  return (
    <section className="mb-8 rounded-xl bg-white p-6 text-black" aria-labelledby="weekly-summary-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="weekly-summary-heading" className="text-xl font-bold">
          {t('title')}
        </h2>
        {summaries.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            {t('week')}
            <select
              className="rounded border border-gray-300 px-2 py-1"
              value={selected?.id}
              onChange={(event) => setSelectedId(Number(event.target.value))}
            >
              {summaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {date(s.periodStart)} – {date(s.periodEnd)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!loading && !selected && <p className="text-gray-600">{t('none')}</p>}
      {selected && (
        <>
          <p className="mb-4 text-sm text-gray-600">
            {t('meta', {
              from: date(selected.periodStart),
              to: date(selected.periodEnd),
              reports: selected.reportCount,
              feedback: selected.feedbackCount,
            })}
            {selected.costEur !== null && ` · ${t('cost', { cost: Number(selected.costEur).toFixed(2), model: selected.model ?? '' })}`}
          </p>
          <div lang="en" className="prose max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.summary}</ReactMarkdown>
          </div>
        </>
      )}
    </section>
  );
};
