import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { GetServerSideProps } from 'next';

import { ImprintContent } from '@eduhub/components/legal/ImprintContent';

import Layout from '../components/Layout';
import SiteLegalNote from '../components/SiteLegalNote';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { portalHost } from '../lib/requestHost';

type Props = { portal: PortalBranding };

/**
 * Imprint for the StuJo job board.
 *
 * The body comes from the shared edu-hub component so that both sites state
 * the same provider details from one source -- Campus Business Box e.V. is
 * the Anbieter of both. The route name matches the legacy stujo.net URL, so
 * old links keep working without a redirect.
 */
const Impressum: FC<Props> = ({ portal }) => {
  const isEnglish = useRouter().locale === 'en';

  return (
    <Layout portal={portal}>
      <Head>
        <title>{`${isEnglish ? 'Imprint' : 'Impressum'} | ${portal.title}`}</title>
      </Head>

      <div className="stujo-legal">
        <h1>{isEnglish ? 'Imprint' : 'Impressum'}</h1>
        <SiteLegalNote portal={portal} />
        <ImprintContent privacyHref="/datenschutz" />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(portalHost(req));
  return { props: { portal } };
};

export default Impressum;
