import Head from 'next/head';
import { FC } from 'react';
import { GetServerSideProps } from 'next';

import FaqSection from '@eduhub/components/common/FaqSection';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { portalHost } from '../lib/requestHost';

type Props = { portal: PortalBranding };

// One collection serves every portal: portals are a branding dimension, not
// a content dimension (docs/STUJO_INTEGRATION_PLAN.md 2.4).
const FAQ_COLLECTION = 'stujo';

/**
 * FAQ page, replacing the footer link that used to point at the legacy
 * Rails page on www.stujo.net/faq.
 *
 * The content lives in the `stujo` FaqCollection (migration
 * 1788800000000_insert_stujo_faq_collection), and the accordion is the very
 * same FaqSection edu-hub renders on its homepage — it resolves the locale
 * and the DE/EN translation itself, and its colours come from the
 * `--eduhub-*` tokens StuJo redefines in globals.css.
 */
const Faq: FC<Props> = ({ portal }) => (
  <Layout portal={portal}>
    <Head>
      <title>FAQ | {portal.title}</title>
    </Head>

    <FaqSection collection={FAQ_COLLECTION} />
  </Layout>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(portalHost(req));
  return { props: { portal } };
};

export default Faq;
