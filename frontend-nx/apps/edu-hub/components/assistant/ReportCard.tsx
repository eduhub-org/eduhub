import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdOutlineFeedback } from 'react-icons/md';

import type { AssistantError, ProposalStatus, ReportDraft } from './api';

export interface ReportState {
  key: string;
  draft: ReportDraft;
  /** PROPOSED until the user clicks; APPLIED once sent, DISCARDED once dismissed. */
  status: ProposalStatus;
  busy: boolean;
  error?: AssistantError;
}

/** Errors after which sending again can't succeed. */
const FINAL_ERRORS = [
  'REPORT_ALREADY_VOTED',
  'REPORT_CLOSED',
  'REPORT_NOT_WITHDRAWABLE',
  'REPORT_LIMIT_REACHED',
  'INVALID_REQUEST',
];

interface Props {
  state: ReportState;
  onSend: () => void;
  onDismiss: () => void;
}

/**
 * A bug report, feature idea, vote or withdrawal the Assistant drafted (issue #2234). Nothing is
 * sent until the user clicks the button; the model can't send it.
 */
export const ReportCard: FC<Props> = ({ state, onSend, onDismiss }) => {
  const t = useTranslations('assistant.report');
  const tErrors = useTranslations('assistant.errors');
  const { draft, status, busy, error } = state;
  const finished = status === 'APPLIED' || status === 'DISCARDED';
  const canSend = !finished && !busy && !(error && FINAL_ERRORS.includes(error.code));
  const headingId = `report-${state.key}`;
  const typeLabel = draft.kind === 'withdraw' ? '' : t(`types.${draft.type}`);

  const title =
    draft.kind === 'create'
      ? t('title_create', { type: typeLabel })
      : draft.kind === 'vote'
        ? t('title_vote', { type: typeLabel })
        : t('title_withdraw');
  const action = draft.kind === 'create' ? t('send') : draft.kind === 'vote' ? t('vote') : t('withdraw');
  const done = draft.kind === 'create' ? t('sent') : draft.kind === 'vote' ? t('voted') : t('withdrawn');

  return (
    <section
      aria-labelledby={headingId}
      className="my-3 flex flex-col gap-3 rounded-xl border border-border-primary p-4 text-sm text-label-primary"
      data-testid="report-card"
    >
      <div>
        <h3 id={headingId} className="flex items-center gap-1.5 text-xs font-semibold text-label-secondary">
          <MdOutlineFeedback className="text-base text-brand-light" aria-hidden="true" />
          {title}
        </h3>
        {!finished && <p className="mt-0.5 text-xs text-label-disabled">{t('not_sent_yet')}</p>}
      </div>

      {draft.kind === 'create' ? (
        <div className="flex flex-col gap-1 break-words">
          <p className="font-semibold">{draft.title}</p>
          <p className="whitespace-pre-wrap text-label-secondary">{draft.description}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 break-words">
          <p className="font-semibold">{draft.summary}</p>
          {!finished && (
            <p className="text-xs text-label-secondary">
              {draft.kind === 'vote' ? t('vote_hint') : t('withdraw_hint')}
            </p>
          )}
        </div>
      )}

      <div aria-live="polite" className="empty:hidden">
        {status === 'APPLIED' && <p className="font-medium text-success">{done}</p>}
        {status === 'DISCARDED' && <p className="text-label-secondary">{t('dismissed')}</p>}
        {error && (
          <p className="text-error" role="status">
            {error.message || (tErrors.has(error.code) ? tErrors(error.code) : tErrors('generic'))}
          </p>
        )}
      </div>

      {!finished && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="rounded-full bg-label-primary px-4 py-1.5 font-semibold text-bg-primary disabled:opacity-50"
          >
            {busy ? t('sending') : action}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="rounded-full px-3 py-1.5 font-medium text-label-secondary hover:text-label-primary disabled:opacity-50"
          >
            {t('dismiss')}
          </button>
        </div>
      )}
    </section>
  );
};
