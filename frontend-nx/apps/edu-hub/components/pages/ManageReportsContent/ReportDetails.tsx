import { FC, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ISSUE_REPORT_OPTIONS,
  UPDATE_ISSUE_REPORT_DUPLICATE_OF,
  UPDATE_ISSUE_REPORT_GITHUB_URL,
  UPDATE_ISSUE_REPORT_PUBLIC_NOTE,
} from '../../../queries/issueReports';
import { IssueReportList_IssueReport } from '../../../queries/__generated__/IssueReportList';
import { IssueReportOptions } from '../../../queries/__generated__/IssueReportOptions';
import { peopleAffected } from './reportUtils';

interface Props {
  row: IssueReportList_IssueReport;
  onError: (message: string) => void;
}

/** One report in full: the text, where it came from, who sent it, and what reporters see back. */
export const ReportDetails: FC<Props> = ({ row, onError }) => {
  const t = useTranslations('manageReports');
  const { data } = useAdminQuery<IssueReportOptions>(ISSUE_REPORT_OPTIONS);
  const [markDuplicate] = useAdminMutation(UPDATE_ISSUE_REPORT_DUPLICATE_OF, { refetchQueries: ['IssueReportList', 'IssueReportOptions'] });

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
        await markDuplicate({ variables: { id: row.id, duplicateOfId: Number(value) } });
      } catch {
        onError(t('error.duplicate_failed'));
      }
    },
    [markDuplicate, row.id, onError, t]
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
      <InputField
        variant="material"
        type="link"
        label={t('details.github_issue')}
        itemId={row.id}
        value={row.githubIssueUrl ?? ''}
        maxLength={500}
        helpText={t('help.github_issue')}
        updateValueMutation={UPDATE_ISSUE_REPORT_GITHUB_URL}
        refetchQueries={['IssueReportList']}
      />
    </div>
  );
};
