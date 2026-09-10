import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { GetServerSideProps } from 'next';

import {
  PrivacyAsOfDate,
  PrivacyDataCollection,
  PrivacyGeneralInfo,
  PrivacyHosting,
  PrivacyJobPostings,
  PrivacyOrganizationAccounts,
  PrivacyOverview,
  PrivacyPayments,
} from '@eduhub/components/legal/PrivacySections';

import Layout from '../components/Layout';
import SiteLegalNote from '../components/SiteLegalNote';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { portalHost } from '../lib/requestHost';

type Props = { portal: PortalBranding };

/**
 * Privacy policy for the StuJo job board.
 *
 * The wording is the shared one from edu-hub, but StuJo renders only the
 * sections that describe what it actually does. Deliberately NOT rendered,
 * because none of it happens here: the tracking summary, Formbricks,
 * Cookiebot, Plausible, the Meta Pixel, course participation, guest
 * registration and the newsletter. Section numbers are passed in for that
 * reason -- see the note in the shared file before adding a cross-reference.
 *
 * The route name matches the legacy stujo.net URL, so old links keep working
 * without a redirect.
 */
const Datenschutz: FC<Props> = ({ portal }) => {
  const isEnglish = useRouter().locale === 'en';

  return (
    <Layout portal={portal}>
      <Head>
        <title>{`${isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'} | ${portal.title}`}</title>
      </Head>

      <div className="stujo-legal">
        <h1>{isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}</h1>
        <SiteLegalNote portal={portal} />

        <PrivacyOverview n={1} imprintHref="/impressum" />
        <PrivacyHosting n={2} />
        <PrivacyGeneralInfo n={3} imprintHref="/impressum" />
        <PrivacyDataCollection n={4}>
          <PrivacyOrganizationAccounts />
        </PrivacyDataCollection>
        <PrivacyJobPostings n={5} />
        <PrivacyPayments n={6} />
        <PrivacyAsOfDate />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(portalHost(req));
  return { props: { portal } };
};

export default Datenschutz;
