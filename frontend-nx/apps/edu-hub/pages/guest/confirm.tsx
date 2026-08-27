import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Page } from '../../components/layout/Page';
import { AuthRoles } from '../../types/enums';
import { useRoleMutation } from '../../hooks/authedMutation';
import { CONFIRM_GUEST_REGISTRATION } from '../../queries/guestRegistration';
import {
  ConfirmGuestRegistration,
  ConfirmGuestRegistrationVariables,
} from '../../queries/__generated__/ConfirmGuestRegistration';

/**
 * Landing page for the guest double opt-in link.
 *
 * Redeeming the token is what actually creates the registration, so this page
 * runs the mutation on load rather than behind a button - the person already
 * expressed intent by clicking the link in their mail.
 *
 * Public by design: it must work for someone with no account and no session.
 */
const GuestConfirm: FC = () => {
  const router = useRouter();
  const t = useTranslations('guest');

  const [confirm] = useRoleMutation<ConfirmGuestRegistration, ConfirmGuestRegistrationVariables>(
    CONFIRM_GUEST_REGISTRATION,
    { context: { role: AuthRoles.anonymous } }
  );

  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [manageToken, setManageToken] = useState<string>('');
  const [errorKey, setErrorKey] = useState<string>('errors.invalid_token');

  // React 18 mounts effects twice in development. Redeeming is single-use, so a
  // second call would report "already used" and show an error for a
  // confirmation that in fact succeeded.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!router.isReady || hasRun.current) return;

    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (!token) {
      setState('error');
      setErrorKey('errors.invalid_token');
      return;
    }

    hasRun.current = true;

    confirm({ variables: { token } })
      .then((result) => {
        const response = result.data?.confirmGuestRegistration;
        if (response?.success) {
          setCourseId(response.courseId ?? null);
          setCourseTitle(response.courseTitle ?? '');
          setManageToken(response.manageToken ?? '');
          setState('success');
          return;
        }
        setErrorKey(`errors.${(response?.messageKey ?? 'INVALID_TOKEN').toLowerCase()}`);
        setState('error');
      })
      .catch(() => {
        setErrorKey('errors.guest_confirmation_failed');
        setState('error');
      });
  }, [confirm, router.isReady, router.query.token]);

  return (
    <div className="max-w-screen-md mx-auto mt-14">
      <Head>
        <title>{t('confirm.page_title')} | EduHub | opencampus.sh</title>
        {/* This URL carries a single-use credential; keep it out of search indexes. */}
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="px-6 py-12 space-y-6">
          {state === 'pending' && <p>{t('confirm.checking')}</p>}

          {state === 'success' && (
            <>
              <h1 className="text-3xl font-bold">{t('confirm.success_title')}</h1>
              <p>{t('confirm.success_body', { course: courseTitle })}</p>
              <p className="text-sm text-label-secondary">{t('confirm.success_hint')}</p>

              <div className="flex flex-col gap-3 pt-4">
                {courseId != null && (
                  <Link href={`/course/${courseId}`} className="text-brand hover:underline">
                    {t('confirm.to_event')}
                  </Link>
                )}
                {/* Offered here as well as in every mail: someone who bookmarks
                    this page keeps a route to their data even if the mail is
                    lost. */}
                {manageToken && (
                  <Link
                    href={`/guest/manage?token=${encodeURIComponent(manageToken)}`}
                    className="text-brand hover:underline"
                  >
                    {t('confirm.manage_registration')}
                  </Link>
                )}
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <h1 className="text-3xl font-bold">{t('confirm.error_title')}</h1>
              <p>{t(errorKey)}</p>
              <Link href="/" className="text-brand hover:underline">
                {t('confirm.to_home')}
              </Link>
            </>
          )}
        </div>
      </Page>
    </div>
  );
};

export default GuestConfirm;
