import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MdArrowForward, MdOutlineEditNote } from 'react-icons/md';

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
      className="my-3 flex flex-col gap-3 rounded-xl border border-border-primary p-4 text-sm text-label-primary"
      data-testid="proposed-change"
    >
      <div>
        <h3 id={headingId} className="flex items-center gap-1.5 text-xs font-semibold text-label-secondary">
          <MdOutlineEditNote className="text-base text-brand-light" aria-hidden="true" />
          {t('title', { kind: kindLabel })}
        </h3>
        {!finished && <p className="mt-0.5 text-xs text-label-disabled">{t('not_saved_yet')}</p>}
      </div>

      <dl className="flex flex-col gap-3">
        {keys.map((key) => {
          const old = before[key];
          const next = after[key];
          const textDiff = typeof old === 'string' && typeof next === 'string';
          const simple = (value: unknown) => value === null || value === undefined || typeof value !== 'object';
          return (
            <div key={key} className="min-w-0">
              <dt className="text-xs text-label-disabled">{label(key)}</dt>
              {textDiff ? (
                <dd className="whitespace-pre-wrap break-words leading-relaxed" aria-label={t('text_diff', { field: label(key) })}>
                  {wordDiff(old, next).map((part, index) =>
                    part.type === 'same' ? (
                      <span key={index}>{part.text}</span>
                    ) : part.type === 'added' ? (
                      <ins key={index} className="rounded-sm bg-diff-added px-0.5 no-underline" title={t('added')}>
                        {part.text}
                      </ins>
                    ) : (
                      <del key={index} className="rounded-sm bg-diff-removed px-0.5" title={t('removed')}>
                        {part.text}
                      </del>
                    )
                  )}
                </dd>
              ) : simple(old) && simple(next) ? (
                <dd className="flex flex-wrap items-center gap-1.5 break-words">
                  <span className="sr-only">{t('before')}:</span>
                  <del className="text-label-disabled">{key in before ? formatValue(old) : t('none')}</del>
                  <MdArrowForward className="shrink-0 text-label-disabled" aria-hidden="true" />
                  <span className="sr-only">{t('after')}:</span>
                  <ins className="font-semibold no-underline">{key in after ? formatValue(next) : t('none')}</ins>
                </dd>
              ) : (
                <dd className="mt-1 flex flex-col gap-2">
                  <div className="min-w-0 break-words text-label-disabled">
                    <span className="block text-xs">{t('before')}</span>
                    {key in before ? formatValue(old) : <span className="italic">{t('none')}</span>}
                  </div>
                  <div className="min-w-0 break-words">
                    <span className="block text-xs text-label-disabled">{t('after')}</span>
                    {key in after ? formatValue(next) : <span className="italic">{t('none')}</span>}
                  </div>
                </dd>
              )}
            </div>
          );
        })}
      </dl>

      <div aria-live="polite" className="empty:hidden">
        {status === 'APPLIED' && <p className="font-medium text-success">{t('applied')}</p>}
        {status === 'DISCARDED' && <p className="text-label-secondary">{t('discarded')}</p>}
        {error && (
          <p className="text-error" role="status">
            {/* The widget's own texts fit the card best; the server's localized message covers the other codes. */}
            {t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : error.message || t('errors.generic')}
          </p>
        )}
      </div>

      {!finished && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onApply}
            disabled={!canApply}
            className="rounded-full bg-label-primary px-4 py-1.5 font-semibold text-bg-primary disabled:opacity-50"
          >
            {busy ? t('applying') : t('apply')}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="rounded-full px-3 py-1.5 font-medium text-label-secondary hover:text-label-primary disabled:opacity-50"
          >
            {t('discard')}
          </button>
        </div>
      )}
    </section>
  );
};
