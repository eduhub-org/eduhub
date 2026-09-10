import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { portalHost } from '../lib/requestHost';
import { fetchAnonymous } from '../lib/hasura';

type Price = { jobPostingType: string; price: number; currency: string; durationDays: number };
type Props = { portal: PortalBranding; prices: Price[] };

/**
 * Employer landing page with the intro copy from the live Arbeitgeber page
 * and the current prices (from JobPostingPrice).
 */
const ForEmployers: FC<Props> = ({ portal, prices }) => {
  const t = useTranslations('forEmployers.ForEmployers');
  const tType = useTranslations('jobType');
  const router = useRouter();
  const formatPrice = (price: Price) =>
    new Intl.NumberFormat(router.locale === 'en' ? 'en-GB' : 'de-DE', {
      style: 'currency',
      currency: price.currency || 'EUR',
    }).format(price.price / 100);

  return (
    <Layout portal={portal}>
      <h2>{t('title')}</h2>
      <p style={{ maxWidth: '46em' }}>{t('intro')}</p>
      <h3>{t('prices_title')}</h3>
      <table className="stujo-table" style={{ maxWidth: '32rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>{t('category')}</th>
            <th style={{ textAlign: 'right' }}>{t('net_price')}</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p.jobPostingType}>
              <td>{tType(p.jobPostingType)}</td>
              <td style={{ textAlign: 'right' }}>
                {p.price === 0 ? t('free') : formatPrice(p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/mein-stujo/neu" className="stujo-btn">
          {t('post_offer')}
        </Link>
      </p>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const [portal, data] = await Promise.all([
    resolvePortal(portalHost(req)),
    fetchAnonymous<{ JobPostingPrice: Price[] }>(/* GraphQL */ `
      query Prices {
        JobPostingPrice(order_by: { price: asc }) {
          jobPostingType
          price
          currency
          durationDays
        }
      }
    `),
  ]);
  return { props: { portal, prices: data.JobPostingPrice } };
};

export default ForEmployers;
