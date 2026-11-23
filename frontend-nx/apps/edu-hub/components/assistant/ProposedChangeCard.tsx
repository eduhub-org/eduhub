import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import type { AssistantError, ProposalStatus, ProposedChange } from './api';
import { wordDiff } from './wordDiff';

export interface ProposalState {
  /** Stable id for this card; the proposedChangeId is dropped once discarded. */
  key: string;
  proposal: ProposedChange;
  status: ProposalStatus;
  /** True while apply or discard is on its way. */
  busy: boolean;
  error?: AssistantError;
}

/** Errors after which applying again can't succeed; the Organizer has to ask for a new proposal. */
export const FINAL_APPLY_ERRORS = [
  'TITLE_TAKEN',
  'STALE',
  'EXPIRED',
  'FORBIDDEN',
  'ROLE_NOT_ALLOWED',
  'INVALID',
  'NO_CHANGE',
  'NOT_FOUND',
  'REGISTRATIONS_EXIST',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const describeItem = (item: unknown): string => {
  if (!isRecord(item)) return String(item);
  const title = typeof item.title === 'string' ? item.title : undefined;
  const start = typeof item.startDateTime === 'string' ? item.startDateTime : undefined;
  const end = typeof item.endDateTime === 'string' ? item.endDateTime : undefined;
  if (title || start) return [title, start && `${start}${end ? ` – ${end}` : ''}`].filter(Boolean).join(' · ');
  return JSON.stringify(item);
};

interface Props {
  state: ProposalState;
  onApply: () => void;
  onDiscard: () => void;
}

export const ProposedChangeCard: FC<Props> = ({ state, onApply, onDiscard }) => {
  const t = useTranslations('assistant.proposal');
  const { proposal, status, busy, error } = state;

  const label = (key: string) => (t.has(`fields.${key}`) ? t(`fields.${key}`) : key);
  const kindLabel = t.has(`kinds.${proposal.kind}`) ? t(`kinds.${proposal.kind}`) : proposal.kind;

  const formatValue = (value: unknown): ReactNode => {
    if (value === null || value === undefined || value === '') return <span className="italic">{t('empty')}</span>;
    if (typeof value === 'boolean') return value ? t('yes') : t('no');
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="italic">{t('none')}</span>;
      return (
        <ul className="list-disc pl-4">
          {value.map((item, index) => (
            <li key={index}>{describeItem(item)}</li>
          ))}
        </ul>
      );
    }
    if (isRecord(value)) return <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(value, null, 2)}</pre>;
    return String(value);
  };

  const finished = status === 'APPLIED' || status === 'DISCARDED';
  const before = isRecord(proposal.before) ? proposal.before : {};
  const after = isRecord(proposal.after) ? proposal.after : {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  const canApply = !finished && !busy && !(error && FINAL_APPLY_ERRORS.includes(error.code));
  const headingId = `proposal-${state.key}`;

  return (
    <section
      aria-labelledby={headingId}
      className="my-2 rounded-lg border border-border-primary bg-bg-card p-3 text-sm text-label-primary"
      data-testid="proposed-change"
    >
      <h3 id={headingId} className="font-semibold">
        {t('title', { kind: kindLabel })}
      </h3>
      {!finished && <p className="mb-2 text-xs text-label-secondary">{t('not_saved_yet')}</p>}

      <dl className="space-y-2">
        {keys.map((key) => {
          const old = before[key];
          const next = after[key];
          const textDiff = typeof old === 'string' && typeof next === 'string';
          return (
            <div key={key} className="min-w-0">
              <dt className="font-medium">{label(key)}</dt>
              {textDiff ? (
                <dd className="whitespace-pre-wrap break-words" aria-label={t('text_diff', { field: label(key) })}>
                  {wordDiff(old, next).map((part, index) =>
                    part.type === 'same' ? (
                      <span key={index}>{part.text}</span>
                    ) : part.type === 'added' ? (
                      <ins key={index} className="bg-diff-added no-underline" title={t('added')}>
                        {part.text}
                      </ins>
                    ) : (
                      <del key={index} className="bg-diff-removed" title={t('removed')}>
                        {part.text}
                      </del>
                    )
                  )}
                </dd>
              ) : (
                <dd className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <div className="min-w-0 break-words rounded bg-diff-removed p-1">
                    <span className="block text-xs text-label-secondary">{t('before')}</span>
                    {key in before ? formatValue(old) : <span className="italic">{t('none')}</span>}
                  </div>
                  <div className="min-w-0 break-words rounded bg-diff-added p-1">
                    <span className="block text-xs text-label-secondary">{t('after')}</span>
                    {key in after ? formatValue(next) : <span className="italic">{t('none')}</span>}
                  </div>
                </dd>
              )}
            </div>
          );
        })}
      </dl>

      <div aria-live="polite">
        {status === 'APPLIED' && <p className="mt-2 font-medium text-success">{t('applied')}</p>}
        {status === 'DISCARDED' && <p className="mt-2 text-label-secondary">{t('discarded')}</p>}
        {error && (
          <p className="mt-2 text-error" role="status">
            {/* The MCP server's messages are English, so translated codes come first. */}
            {t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : error.message || t('errors.generic')}
          </p>
        )}
      </div>

      {!finished && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={!canApply}
            className="rounded-full bg-cta px-4 py-1 text-label-primary hover:bg-cta-hover disabled:opacity-50"
          >
            {busy ? t('applying') : t('apply')}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="rounded-full border border-label-primary px-4 py-1 disabled:opacity-50"
          >
            {t('discard')}
          </button>
        </div>
      )}
    </section>
  );
};
