import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';
import {
  PrivacyAnalytics,
  PrivacyAsOfDate,
  PrivacyConsentManagement,
  PrivacyCourseParticipation,
  PrivacyDataCollection,
  PrivacyFormbricks,
  PrivacyGeneralInfo,
  PrivacyGuestRegistration,
  PrivacyHosting,
  PrivacyMarketing,
  PrivacyNewsletter,
  PrivacyOrganizationAccounts,
  PrivacyOverview,
  PrivacyOverviewTracking,
  PrivacyPayments,
} from '../../components/legal/PrivacySections';

/**
 * EduHub renders every section of the shared policy. StuJo renders the subset
 * that applies to it (apps/stujo/pages/datenschutz.tsx), which is why each
 * section takes its own number rather than hard-coding one.
 */
const Privacy: FC = () => {
  const { locale } = useRouter();
  const isEnglish = locale === 'en';

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>{isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'} | EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-label-primary">
        <div className="flex flex-row">
          <h1 className="text-4xl font-bold p-4 md:p-24 md:pl-12 pb-0">
            {isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}
          </h1>
        </div>

        <div className="mx-4 md:ml-12 md:mr-10">
          <PrivacyOverview n={1} imprintHref="/imprint">
            <PrivacyOverviewTracking />
          </PrivacyOverview>
          <PrivacyHosting n={2} />
          <PrivacyGeneralInfo n={3} imprintHref="/imprint" />
          <PrivacyDataCollection n={4}>
            <PrivacyOrganizationAccounts />
            <PrivacyCourseParticipation />
            <PrivacyGuestRegistration />
            <PrivacyNewsletter />
          </PrivacyDataCollection>
          <PrivacyFormbricks n={5} />
          <PrivacyPayments n={6} />
          <PrivacyConsentManagement n={7} />
          <PrivacyAnalytics n={8} />
          <PrivacyMarketing n={9} />
          <PrivacyAsOfDate />
        </div>
      </Page>
    </div>
  );
};

export default Privacy;
