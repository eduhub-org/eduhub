import { gql, useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import { signIn, useSession } from 'next-auth/react';
import { FC, useEffect, useState } from 'react';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';

type Props = { portal: PortalBranding };

const USER_ROLE_CONTEXT = { role: 'user' };

const MY_SUBSCRIPTION = gql`
  query MyJobAlertSubscription {
    JobAlertSubscription {
      id
      active
      jobPostingType
      region
      lastSentAt
    }
    JobPostingType {
      value
    }
    JobRegion {
      value
    }
  }
`;

const SUBSCRIBE = gql`
  mutation SubscribeJobAlert($jobPostingType: JobPostingType_enum, $region: JobRegion_enum) {
    insert_JobAlertSubscription_one(
      object: { active: true, jobPostingType: $jobPostingType, region: $region }
    ) {
      id
    }
  }
`;

const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateJobAlertSubscription(
    $id: Int!
    $active: Boolean!
    $jobPostingType: JobPostingType_enum
    $region: JobRegion_enum
  ) {
    update_JobAlertSubscription_by_pk(
      pk_columns: { id: $id }
      _set: { active: $active, jobPostingType: $jobPostingType, region: $region }
    ) {
      id
    }
  }
`;

/**
 * Job-Letter settings (weekly email alert). Replaces the Rails
 * jobletterconfig UI — this time with a cron that actually sends.
 */
const JobLetter: FC<Props> = ({ portal }) => {
  const { status: sessionStatus } = useSession();
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(MY_SUBSCRIPTION, {
    context: USER_ROLE_CONTEXT,
    skip: sessionStatus !== 'authenticated',
  });
  const subscription = data?.JobAlertSubscription?.[0] ?? null;

  const [subscribe, { loading: subscribing }] = useMutation(SUBSCRIBE, {
    context: USER_ROLE_CONTEXT,
  });
  const [updateSubscription, { loading: updating }] = useMutation(UPDATE_SUBSCRIPTION, {
    context: USER_ROLE_CONTEXT,
  });

  useEffect(() => {
    if (subscription) {
      setType(subscription.jobPostingType ?? '');
      setRegion(subscription.region ?? '');
    }
  }, [subscription]);

  const save = async (active: boolean) => {
    setNotice(null);
    if (subscription) {
      await updateSubscription({
        variables: {
          id: subscription.id,
          active,
          jobPostingType: type || null,
          region: region || null,
        },
      });
    } else {
      await subscribe({ variables: { jobPostingType: type || null, region: region || null } });
    }
    await refetch();
    setNotice(active ? 'Job-Letter abonniert – Du bekommst jeden Montag die neuen Angebote.' : 'Job-Letter abbestellt.');
  };

  if (sessionStatus === 'unauthenticated') {
    return (
      <Layout portal={portal}>
        <h1>Job-Letter</h1>
        <p>Melde Dich an, um den wöchentlichen Job-Letter zu abonnieren.</p>
        <button className="stujo-btn stujo-btn--primary" onClick={() => signIn('keycloak')}>
          Einloggen
        </button>
      </Layout>
    );
  }

  return (
    <Layout portal={portal}>
      <h1>Job-Letter</h1>
      <p style={{ maxWidth: '40rem' }}>
        Einmal pro Woche die neuen Stellenangebote per E-Mail – optional gefiltert nach Kategorie
        und Region.
      </p>
      {notice && <div className="stujo-notice">{notice}</div>}
      {loading ? (
        <p className="stujo-muted">Lädt …</p>
      ) : (
        <div className="stujo-form" style={{ maxWidth: '28rem' }}>
          <label className="stujo-field">
            <span>Kategorie (optional)</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">Alle Kategorien</option>
              {data?.JobPostingType?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </label>
          <label className="stujo-field">
            <span>Region (optional)</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">Alle Regionen</option>
              {data?.JobRegion?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </label>
          <div className="stujo-form-actions">
            {subscription?.active ? (
              <>
                <button
                  className="stujo-btn stujo-btn--ghost"
                  disabled={updating}
                  onClick={() => save(false)}
                >
                  Abbestellen
                </button>
                <button
                  className="stujo-btn stujo-btn--primary"
                  disabled={updating}
                  onClick={() => save(true)}
                >
                  Filter speichern
                </button>
              </>
            ) : (
              <button
                className="stujo-btn stujo-btn--accent"
                disabled={subscribing || updating}
                onClick={() => save(true)}
              >
                Job-Letter abonnieren
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  return { props: { portal } };
};

export default JobLetter;
