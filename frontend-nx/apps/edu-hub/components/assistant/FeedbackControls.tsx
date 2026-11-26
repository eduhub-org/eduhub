import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdOutlineThumbDown, MdOutlineThumbUp, MdThumbDown, MdThumbUp } from 'react-icons/md';

import { ChatMessagePayload, sendFeedback } from './api';

type Step = 'ask' | 'consent' | 'sending' | 'thanks' | 'failed';

interface Props {
  role: string;
  /** The route pattern the user is on, without IDs. */
  route: string;
  /** The conversation up to and including the rated answer, only sent for 👎 when the user agrees. */
  getMessages: () => ChatMessagePayload[];
  /** Always shown (the latest answer); earlier answers show it on hover, focus or touch. */
  persistent?: boolean;
  /** The rating this answer already has; it outlives closing the panel. */
  rated?: 'up' | 'down';
  onRate: (rating: 'up' | 'down' | undefined) => void;
}

// 44 px touch targets on touch screens, so a miss on 👎 can't land on 👍.
const iconButton =
  'inline-flex items-center justify-center rounded-md p-1 text-label-disabled hover:bg-bg-secondary hover:text-label-primary disabled:opacity-50 [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px]';

/** 👍 / 👎 for one answer. 👎 asks before the conversation up to that answer is kept. */
export const FeedbackControls: FC<Props> = ({ role, route, getMessages, persistent = false, rated, onRate }) => {
  const t = useTranslations('assistant.feedback');
  const [step, setStep] = useState<Step>('ask');
  const rating = rated ?? null;

  const submit = async (value: 'up' | 'down', consent: boolean) => {
    // Recorded before sending, so a reopened panel can't send it a second time.
    onRate(value);
    setStep('sending');
    const ok = await sendFeedback(
      { rating: value, consent, route, ...(value === 'down' && consent && { messages: getMessages() }) },
      role
    );
    if (!ok) onRate(undefined);
    setStep(ok ? 'thanks' : 'failed');
  };

  const chosen = (step !== 'ask' && step !== 'failed') || Boolean(rated);
  const visibility =
    persistent || chosen
      ? ''
      : 'opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100';

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className={`flex items-center gap-1 ${visibility}`} role="group" aria-label={t('question')}>
        <button
          type="button"
          aria-label={t('helpful')}
          aria-pressed={rating === 'up'}
          disabled={chosen}
          onClick={() => submit('up', false)}
          className={iconButton}
        >
          {rating === 'up' ? <MdThumbUp aria-hidden="true" /> : <MdOutlineThumbUp aria-hidden="true" />}
        </button>
        <button
          type="button"
          aria-label={t('not_helpful')}
          aria-pressed={rating === 'down' || step === 'consent'}
          disabled={chosen}
          onClick={() => setStep('consent')}
          className={iconButton}
        >
          {rating === 'down' || step === 'consent' ? <MdThumbDown aria-hidden="true" /> : <MdOutlineThumbDown aria-hidden="true" />}
        </button>
        {step === 'thanks' && (
          <p className="ml-1 text-xs text-label-secondary" role="status">
            {t('thanks')}
          </p>
        )}
        {step === 'failed' && (
          <p className="ml-1 text-xs text-error" role="status">
            {t('failed')}
          </p>
        )}
      </div>

      {step === 'consent' && (
        <div className="rounded-lg bg-bg-secondary p-3 text-sm" role="group" aria-label={t('consent_label')}>
          <p className="mb-2">{t('consent_question')}</p>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded-full bg-label-primary px-4 py-1 font-semibold text-bg-primary"
              onClick={() => submit('down', true)}
            >
              {t('consent_yes')}
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-label-secondary hover:text-label-primary"
              onClick={() => submit('down', false)}
            >
              {t('consent_no')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
