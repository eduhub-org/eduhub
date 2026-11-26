import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { Button } from '../../common/Button';
import InputField from '../../inputs/InputField';
import { IssueReportList_IssueReport } from '../../../queries/__generated__/IssueReportList';
import { peopleAffected } from './reportUtils';
import { SyncRequest, SyncRequestError } from './useReportSync';

interface Props {
  /** The report to approve and the status it gets (PLANNED or IN_PROGRESS); null: closed. */
  target: { row: IssueReportList_IssueReport; status: string } | null;
  repo: string;
  send: (request: SyncRequest) => Promise<unknown>;
  onClose: () => void;
}

const LIMITS = { title: 200, description: 4000 };

/**
 * Approving a report: create a public GitHub issue from text the admin checked, or link an
 * issue the team already has. Confirming is the approval; Cancel leaves the status unchanged.
 */
export const GithubIssueDialog: FC<Props> = ({ target, repo, send, onClose }) => {
  const t = useTranslations('manageReports');
  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setMode('create');
    setTitle(target.row.title);
    setDescription(target.row.description);
    setIssueNumber('');
    setError(null);
  }, [target]);

  if (!target) return null;
  const { row, status } = target;

  const number = Number(issueNumber.replace(/^#/, '').trim());
  const valid =
    mode === 'create'
      ? !!title.trim() && title.trim().length <= LIMITS.title && !!description.trim() && description.trim().length <= LIMITS.description
      : Number.isInteger(number) && number > 0;

  const onConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await send(
        mode === 'create'
          ? { action: 'create', reportId: row.id, status, title: title.trim(), description: description.trim() }
          : { action: 'link', reportId: row.id, status, issueNumber: number }
      );
      onClose();
    } catch (e) {
      const code = e instanceof SyncRequestError ? e.code : 'FAILED';
      setError(t(`sync_error.${code}`, { reportId: e instanceof SyncRequestError ? e.reportId ?? '' : '' }));
    } finally {
      setBusy(false);
    }
  };

  const footer = t('issue_dialog.footer_preview', {
    id: row.id,
    priority: row.priority ? t(`priority.${row.priority}`) : t('priority.none'),
    people: peopleAffected(row),
  });

  return (
    <DialogShell
      open
      onClose={busy ? () => undefined : onClose}
      title={t('issue_dialog.title', { id: row.id, status: t(`status.${status}`) })}
      ariaLabelledBy="github-issue-dialog-title"
      maxWidth="md"
      actions={
        <div className="flex gap-2">
          <Button onClick={onClose} disabled={busy}>
            {t('issue_dialog.cancel')}
          </Button>
          <Button filled onClick={onConfirm} disabled={busy || !valid}>
            {mode === 'create' ? t('issue_dialog.create') : t('issue_dialog.link')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-label-primary">
        <div role="radiogroup" className="flex gap-4">
          {(['create', 'link'] as const).map((m) => (
            <label key={m} className="flex items-center gap-2">
              <input type="radio" name="issue-mode" checked={mode === m} onChange={() => setMode(m)} disabled={busy} />
              {t(`issue_dialog.mode_${m}`)}
            </label>
          ))}
        </div>
        {mode === 'create' ? (
          <>
            <p className="text-sm text-label-secondary">{t('issue_dialog.public_hint', { repo })}</p>
            <InputField
              variant="material"
              type="input"
              label={t('issue_dialog.issue_title')}
              itemId={0}
              debounceTimeout={200}
              value={title}
              maxLength={LIMITS.title}
              onValueUpdated={(data) => setTitle(data.text || '')}
            />
            <InputField
              variant="material"
              type="textarea"
              label={t('issue_dialog.issue_description')}
              itemId={0}
              debounceTimeout={200}
              value={description}
              maxLength={LIMITS.description}
              onValueUpdated={(data) => setDescription(data.text || '')}
            />
            <div>
              <p className="mb-1 text-sm text-label-secondary">{t('issue_dialog.footer_label')}</p>
              <p className="rounded bg-fill-primary p-2 text-sm">{footer}</p>
            </div>
          </>
        ) : (
          <InputField
            variant="material"
            type="input"
            label={t('issue_dialog.issue_number')}
            placeholder="#123"
            itemId={0}
            debounceTimeout={200}
            value={issueNumber}
            helpText={t('issue_dialog.link_help', { repo })}
            onValueUpdated={(data) => setIssueNumber(data.text || '')}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </DialogShell>
  );
};
