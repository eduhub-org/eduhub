import { useRouter } from 'next/router';
import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdVisibility } from 'react-icons/md';

import { useImpersonation } from '../../contexts/ImpersonationContext';

/**
 * Says, on every page, whose account the admin is looking at.
 *
 * Not dismissible on purpose: an impersonation that can be hidden is an
 * impersonation somebody forgets they are in, and the whole point of the page
 * they are reading is that it looks exactly like the other person's.
 */
export const ImpersonationBanner: FC = () => {
  const t = useTranslations('impersonation');
  const { target, stop } = useImpersonation();
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  const handleStop = useCallback(async () => {
    setStopping(true);
    try {
      await stop();
      router.push('/manage/users');
    } finally {
      setStopping(false);
    }
  }, [router, stop]);

  if (!target) return null;

  const name = [target.firstName, target.lastName].filter(Boolean).join(' ').trim();

  return (
    <div className="w-full bg-status-missed light text-label-primary">
      <div
        role="status"
        className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MdVisibility aria-hidden="true" />
          {t('banner', { name: name || target.email || target.id })}
        </span>
        <button
          type="button"
          onClick={handleStop}
          disabled={stopping}
          className="min-h-11 rounded-full border-2 border-border-primary px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {t('exit')}
        </button>
      </div>
    </div>
  );
};
