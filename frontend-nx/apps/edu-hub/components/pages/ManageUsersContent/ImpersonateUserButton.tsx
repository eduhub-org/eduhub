import { useRouter } from 'next/router';
import { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useImpersonation } from '../../../contexts/ImpersonationContext';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

/**
 * Where an impersonation starts. Only reachable from /manage/users, which is
 * admin-only already; the route behind it checks the role again, because a
 * hidden button is not an access control.
 */
export const ImpersonateUserButton: FC<{ userId: string }> = ({ userId }) => {
  const t = useTranslations('impersonation');
  const router = useRouter();
  const { start } = useImpersonation();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClick = useCallback(async () => {
    setPending(true);
    try {
      const result = await start(userId);
      if (!result.ok) {
        setErrorMessage(t('start_failed'));
        return;
      }
      router.push('/');
    } finally {
      setPending(false);
    }
  }, [router, start, t, userId]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="min-h-11 rounded-full border-2 border-border-primary px-3 py-1 text-xs font-semibold transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
      >
        {t('action')}
      </button>
      <ErrorMessageDialog
        open={errorMessage !== ''}
        errorMessage={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </>
  );
};
