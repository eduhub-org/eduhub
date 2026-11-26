import { FC, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { Button } from '../../common/Button';
import { ISSUE_REPORT_OPTIONS, UPDATE_ISSUE_REPORT_PUBLIC_NOTE } from '../../../queries/issueReports';
import { IssueReportList_IssueReport } from '../../../queries/__generated__/IssueReportList';
import { IssueReportOptions } from '../../../queries/__generated__/IssueReportOptions';
import { ISSUE_STATUSES, peopleAffected } from './reportUtils';
import { issueUrl, SyncRequest } from './useReportSync';

interface Props {
  row: IssueReportList_IssueReport;
  /** `owner/name` while the GitHub sync is on, else null. */
  repo: string | null;
  send: (request: SyncRequest) => Promise<unknown>;
  onError: (error: unknown) => void;
  /** Opens the GitHub issue dialog for this report with the status it will get. */
  onApprove: (status: string) => void;
}

/** One report in full: the text, where it came from, who sent it, and what reporters see back. */
export const ReportDetails: FC<Props> = ({ row, repo, send, onError, onApprove }) => {
  const t = useTranslations('manageReports');
  const { data } = useAdminQuery<IssueReportOptions>(ISSUE_REPORT_OPTIONS);

  const duplicateOptions = useMemo(
    () =>
      (data?.IssueReport ?? [])
        .filter((r) => r.id !== row.id)
        .map((r) => ({ value: String(r.id), label: `#${r.id} ${r.title}` })),
    [data, row.id]
  );

  const onDuplicateOf = useCallback(
    async (value: string) => {
      if (!value) return;
      try {
        // Through the sync route: a linked issue is closed as a duplicate too.
        await send({ action: 'status', reportId: row.id, status: 'DUPLICATE', duplicateOfId: Number(value) });
      } catch (e) {
        onError(e);
      }
    },
    [send, row.id, onError]
  );

  const reporter = row.User ? `${row.User.firstName} ${row.User.lastName} (${row.User.email})` : t('details.reporter_removed');

  return (
    <div className="flex flex-col gap-4 bg-fill-primary p-4 text-label-primary">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-label-secondary">{t('details.description')}</h3>
        <p className="whitespace-pre-wrap break-words">{row.description}</p>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-label-secondary">{t('details.id')}</dt>
          <dd>#{row.id}</dd>
        </div>
        <div>
          <dt className="text-label-secondary">{t('details.people')}</dt>
          <dd>{peopleAffected(row)}</dd>
        </div>
        <div>
          <dt className="text-label-secondary">{t('details.page')}</dt>
          <dd className="break-all">{row.route ?? '–'}</dd>
        </div>
        <div>
          <dt className="text-label-secondary">{t('details.role_language')}</dt>
          <dd>
            {row.role ?? '–'} · {row.locale ?? '–'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-label-secondary">{t('details.reporter')}</dt>
          <dd className="break-words">{reporter}</dd>
        </div>
        {row.duplicateOfId && (
          <div className="sm:col-span-2">
            <dt className="text-label-secondary">{t('details.duplicate_of')}</dt>
            <dd>#{row.duplicateOfId}</dd>
          </div>
        )}
      </dl>
      <DropDownSelector
        variant="material"
        label={t('details.mark_duplicate')}
        value={row.duplicateOfId ? String(row.duplicateOfId) : ''}
        options={duplicateOptions}
        searchable
        onValueUpdated={onDuplicateOf}
        helpText={t('help.mark_duplicate')}
      />
      <InputField
        variant="material"
        type="textarea"
        label={t('details.public_note')}
        itemId={row.id}
        value={row.publicNote ?? ''}
        maxLength={2000}
        helpText={t('help.public_note')}
        updateValueMutation={UPDATE_ISSUE_REPORT_PUBLIC_NOTE}
        refetchQueries={['IssueReportList']}
      />
      {repo && (
        <div className="text-sm">
          <h3 className="mb-1 font-semibold text-label-secondary">{t('details.github_issue')}</h3>
          {row.githubIssueNumber ? (
            <p>
              <a
                href={issueUrl(repo, row.githubIssueNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {repo}#{row.githubIssueNumber}
              </a>{' '}
              <span className="text-label-secondary">{t('help.github_synced')}</span>
            </p>
          ) : (
            <div className="flex flex-col items-start gap-1">
              <Button onClick={() => onApprove(ISSUE_STATUSES.includes(row.status) ? row.status : 'PLANNED')}>
                {t('details.github_create_or_link')}
              </Button>
              <span className="text-label-secondary">{t('help.github_issue')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
