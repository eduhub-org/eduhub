import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ChatMessagePayload, sendFeedback } from './api';

type Step = 'ask' | 'consent' | 'sending' | 'thanks' | 'failed';

interface Props {
  role: string;
  /** The route pattern the user is on, without IDs. */
  route: string;
  /** The conversation, only sent for 👎 when the user agrees. */
  getMessages: () => ChatMessagePayload[];
}

/** 👍 / 👎 for the whole conversation. 👎 asks before the conversation is kept. */
export const FeedbackControls: FC<Props> = ({ role, route, getMessages }) => {
  const t = useTranslations('assistant.feedback');
  const [step, setStep] = useState<Step>('ask');

  const submit = async (rating: 'up' | 'down', consent: boolean) => {
    setStep('sending');
    const ok = await sendFeedback(
      { rating, consent, route, ...(rating === 'down' && consent && { messages: getMessages() }) },
      role
    );
    setStep(ok ? 'thanks' : 'failed');
  };

  if (step === 'thanks') return <p className="text-xs text-label-secondary" role="status">{t('thanks')}</p>;
  if (step === 'failed') return <p className="text-xs text-error" role="status">{t('failed')}</p>;

  if (step === 'consent') {
    return (
      <div className="rounded border border-border-primary p-2 text-xs" role="group" aria-label={t('consent_label')}>
        <p className="mb-2">{t('consent_question')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-full bg-cta px-3 py-1 text-label-primary" onClick={() => submit('down', true)}>
            {t('consent_yes')}
          </button>
          <button
            type="button"
            className="rounded-full border border-label-primary px-3 py-1"
            onClick={() => submit('down', false)}
          >
            {t('consent_no')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-label-secondary">
      <span>{t('question')}</span>
      <button
        type="button"
        aria-label={t('helpful')}
        disabled={step === 'sending'}
        onClick={() => submit('up', false)}
        className="rounded p-1 hover:bg-bg-secondary"
      >
        👍
      </button>
      <button
        type="button"
        aria-label={t('not_helpful')}
        disabled={step === 'sending'}
        onClick={() => setStep('consent')}
        className="rounded p-1 hover:bg-bg-secondary"
      >
        👎
      </button>
    </div>
  );
};
