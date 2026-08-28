import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Page } from '../../components/layout/Page';
import { AuthRoles } from '../../types/enums';
import { useRoleMutation } from '../../hooks/authedMutation';
import { MANAGE_GUEST_REGISTRATION } from '../../queries/guestRegistration';
import {
  ManageGuestRegistration,
  ManageGuestRegistrationVariables,
  ManageGuestRegistration_manageGuestRegistration_registrations,
} from '../../queries/__generated__/ManageGuestRegistration';
import { Button } from '../../components/common/Button';
import { QuestionConfirmationDialog } from '../../components/common/dialogs/QuestionConfirmationDialog';

type Registration = ManageGuestRegistration_manageGuestRegistration_registrations;

/**
 * Self-service page for guests, reached by the signed link in their mails.
 *
 * A guest has no login, so this page is the whole of their GDPR Art. 15
 * (what do you hold about me) and Art. 17 (delete it) surface, plus the
 * ability to withdraw from an event. Public by design - requiring a session
 * here would defeat the point.
 */
const GuestManage: FC = () => {
  const router = useRouter();
  const t = useTranslations('guest');

  const [manage, { loading }] = useRoleMutation<ManageGuestRegistration, ManageGuestRegistrationVariables>(
    MANAGE_GUEST_REGISTRATION,
    { context: { role: AuthRoles.anonymous } }
  );

  const [token, setToken] = useState<string>('');
  const [state, setState] = useState<'pending' | 'ready' | 'error' | 'deleted'>('pending');
  const [errorKey, setErrorKey] = useState<string>('errors.invalid_token');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const run = useCallback(
    async (operation: 'LIST' | 'CANCEL_ENROLLMENT' | 'DELETE_ALL_DATA', activeToken: string, courseId?: number) => {
      try {
        const result = await manage({ variables: { token: activeToken, operation, courseId: courseId ?? null } });
        const response = result.data?.manageGuestRegistration;

        if (!response?.success) {
          setErrorKey(`errors.${(response?.messageKey ?? 'INVALID_TOKEN').toLowerCase()}`);
          setState('error');
          return;
        }

        if (operation === 'DELETE_ALL_DATA') {
          setState('deleted');
          return;
        }

        setFirstName(response.firstName ?? '');
        setLastName(response.lastName ?? '');
        setEmail(response.email ?? '');
        setRegistrations((response.registrations ?? []) as Registration[]);
        setState('ready');
      } catch {
        setErrorKey('errors.guest_manage_failed');
        setState('error');
      }
    },
    [manage]
  );

  useEffect(() => {
    if (!router.isReady) return;
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';
    if (!queryToken) {
      setState('error');
      setErrorKey('errors.invalid_token');
      return;
    }
    setToken(queryToken);
    run('LIST', queryToken);
  }, [router.isReady, router.query.token, run]);

  const activeRegistrations = registrations.filter(
    (registration) => !['CANCELLED', 'REJECTED', 'ABORTED'].includes(registration.status)
  );

  return (
    <div className="max-w-screen-md mx-auto mt-14">
      <Head>
        <title>{t('manage.page_title')} | EduHub | opencampus.sh</title>
        {/* This URL carries a credential; keep it out of search indexes. */}
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="px-6 py-12 space-y-8">
          {state === 'pending' && <p>{t('manage.loading')}</p>}

          {state === 'error' && (
            <>
              <h1 className="text-3xl font-bold">{t('manage.error_title')}</h1>
              <p>{t(errorKey)}</p>
              <Link href="/" className="text-brand hover:underline">
                {t('confirm.to_home')}
              </Link>
            </>
          )}

          {state === 'deleted' && (
            <>
              <h1 className="text-3xl font-bold">{t('manage.deleted_title')}</h1>
              <p>{t('manage.deleted_body')}</p>
              <Link href="/" className="text-brand hover:underline">
                {t('confirm.to_home')}
              </Link>
            </>
          )}

          {state === 'ready' && (
            <>
              <h1 className="text-3xl font-bold">{t('manage.page_title')}</h1>

              <section className="space-y-2">
                <h2 className="text-xl font-semibold">{t('manage.your_data')}</h2>
                <p>
                  {firstName} {lastName}
                </p>
                <p>{email}</p>
                <p className="text-sm text-label-secondary">{t('manage.retention_notice')}</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t('manage.your_registrations')}</h2>
                {activeRegistrations.length === 0 ? (
                  <p className="text-sm text-label-secondary">{t('manage.no_registrations')}</p>
                ) : (
                  <ul className="space-y-3">
                    {activeRegistrations.map((registration) => (
                      <li
                        key={registration.courseId}
                        className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded p-4"
                      >
                        <div>
                          <Link href={`/course/${registration.courseId}`} className="text-brand hover:underline">
                            {registration.courseTitle}
                          </Link>
                          {registration.startTime && (
                            <p className="text-sm text-label-secondary">
                              {new Date(registration.startTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => run('CANCEL_ENROLLMENT', token, registration.courseId)}
                          disabled={loading}
                          inverted
                        >
                          {t('manage.cancel_registration')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3 border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold">{t('manage.delete_title')}</h2>
                <p className="text-sm text-label-secondary">{t('manage.delete_body')}</p>
                <Button onClick={() => setConfirmDeleteOpen(true)} disabled={loading}>
                  {t('manage.delete_button')}
                </Button>
              </section>

              <QuestionConfirmationDialog
                open={confirmDeleteOpen}
                question={t('manage.delete_confirm_question')}
                confirmationText={t('manage.delete_button')}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={() => {
                  setConfirmDeleteOpen(false);
                  run('DELETE_ALL_DATA', token);
                }}
              />
            </>
          )}
        </div>
      </Page>
    </div>
  );
};

export default GuestManage;
