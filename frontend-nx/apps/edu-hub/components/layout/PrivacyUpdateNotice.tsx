import Link from 'next/link';
import { FC, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MdClose } from 'react-icons/md';

import { getPrivacyPolicyChange, isNoticeDue, PRIVACY_NOTICE_VERSION } from '../legal/privacyPolicyVersion';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useRoleQuery } from '../../hooks/authedQuery';
import { useCurrentUserId } from '../../hooks/authentication';
import { MARK_PRIVACY_NOTICE_SEEN, MY_PRIVACY_NOTICE_STATE } from '../../queries/privacyNotice';
import { MarkPrivacyNoticeSeen, MarkPrivacyNoticeSeenVariables } from '../../queries/__generated__/MarkPrivacyNoticeSeen';
import { MyPrivacyNoticeState, MyPrivacyNoticeStateVariables } from '../../queries/__generated__/MyPrivacyNoticeState';
import { AuthRoles } from '../../types/enums';

// Every account holds the `user` role; org admins do not inherit user_access.
const USER_ROLE_CONTEXT = { role: AuthRoles.user };

/**
 * Tells account holders once that the privacy policy changed materially.
 *
 * The policy is information, not a contract, so nobody has to accept it: this
 * only makes sure existing users hear about the change. Shown to accounts
 * created before PRIVACY_NOTICE_VERSION (newer ones saw that policy when they
 * registered) until dismissed; the dismissal is stored on the user, so it
 * follows them across devices. Hidden while an admin impersonates someone, so
 * the admin cannot dismiss it on their behalf.
 */
export const PrivacyUpdateNotice: FC = () => {
  const t = useTranslations('privacy_update');
  const locale = useLocale();
  const userId = useCurrentUserId();
  const { target: impersonating } = useImpersonation();
  const [dismissed, setDismissed] = useState(false);

  const { data } = useRoleQuery<MyPrivacyNoticeState, MyPrivacyNoticeStateVariables>(MY_PRIVACY_NOTICE_STATE, {
    variables: { userId },
    skip: !userId || !!impersonating,
    context: USER_ROLE_CONTEXT,
  });
  const [markSeen] = useRoleMutation<MarkPrivacyNoticeSeen, MarkPrivacyNoticeSeenVariables>(
    MARK_PRIVACY_NOTICE_SEEN,
    { context: USER_ROLE_CONTEXT }
  );

  const user = data?.User_by_pk;
  if (dismissed || impersonating || !user || !isNoticeDue(user.created_at, user.privacyNoticeSeenVersion)) {
    return null;
  }

  const change = getPrivacyPolicyChange(PRIVACY_NOTICE_VERSION);

  const handleDismiss = () => {
    setDismissed(true);
    // Best effort: if this fails the notice simply shows again next time.
    markSeen({ variables: { userId, version: PRIVACY_NOTICE_VERSION } }).catch(() => undefined);
  };

  return (
    <div role="status" className="w-full bg-fill-primary text-label-primary border-b border-border-primary">
      <div className="max-w-screen-xl mx-auto flex items-start gap-4 px-3 md:px-16 py-4">
        <div className="flex-1 text-sm leading-relaxed">
          <p className="font-semibold">{t('title')}</p>
          {change && <p className="mt-1">{locale === 'en' ? change.en : change.de}</p>}
          <p className="mt-1">
            {t.rich('more', {
              privacy: (chunks) => (
                <Link href="/privacy#aenderungen" className="underline hover:text-label-secondary">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t('dismiss')}
        >
          <MdClose className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
