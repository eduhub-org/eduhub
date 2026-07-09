import type { GetServerSideProps } from 'next';
import { FC } from 'react';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { fetchAnonymous } from '../lib/hasura';

type Price = { jobPostingType: string; price: number; currency: string; durationDays: number };
type Props = { portal: PortalBranding; prices: Price[] };

/**
 * Employer landing page with the current prices (from JobPostingPrice).
 * The employer dashboard (create/manage postings, Stripe checkout) lands
 * with phase 4 of docs/STUJO_INTEGRATION_PLAN.md.
 */
const ForEmployers: FC<Props> = ({ portal, prices }) => (
  <Layout portal={portal}>
    <h1>Für Arbeitgeber</h1>
    <p>
      Erreiche Studierende der Hochschulen in Schleswig-Holstein mit Deinem Stellenangebot – bis zu
      8 Wochen sichtbar auf allen StuJo-Portalen.
    </p>
    <table>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Kategorie</th>
          <th style={{ textAlign: 'right' }}>Preis (netto)</th>
        </tr>
      </thead>
      <tbody>
        {prices.map((p) => (
          <tr key={p.jobPostingType}>
            <td>{p.jobPostingType}</td>
            <td style={{ textAlign: 'right' }}>
              {p.price === 0 ? 'kostenlos' : `${(p.price / 100).toFixed(2)} €`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Layout>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const [portal, data] = await Promise.all([
    resolvePortal(req.headers.host),
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
