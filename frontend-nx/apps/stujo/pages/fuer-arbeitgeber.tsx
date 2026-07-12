import type { GetServerSideProps } from 'next';
import { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Layout from '../components/Layout';
import { resolvePortal, PortalBranding } from '../lib/portal';
import { fetchAnonymous } from '../lib/hasura';

type Price = { jobPostingType: string; price: number; currency: string; durationDays: number };
type Props = { portal: PortalBranding; prices: Price[] };

/**
 * Employer landing page with the intro copy from the live Arbeitgeber page
 * and the current prices (from JobPostingPrice).
 */
const ForEmployers: FC<Props> = ({ portal, prices }) => {
  const tType = useTranslations('jobType');
  return (
    <Layout portal={portal}>
      <h2>Für Arbeitgeber</h2>
      <p style={{ maxWidth: '46em' }}>
        Als Karriereportal für Studierende in Kiel und Flensburg bietet StuJo Arbeitgebern die
        Möglichkeit, Fachkräfte von morgen frühzeitig kennenzulernen und um sie zu werben. Ob
        Werkstudentenstelle, Praktikum oder erste Festanstellung – StuJo deckt die ganze Bandbreite
        von Angeboten ab! Dein Stellenangebot ist bis zu 8 Wochen auf allen StuJo-Portalen sichtbar.
      </p>
      <h3>Leistungen und Preise</h3>
      <table className="stujo-table" style={{ maxWidth: '32rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Kategorie</th>
            <th style={{ textAlign: 'right' }}>Preis (netto)</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p.jobPostingType}>
              <td>{tType(p.jobPostingType)}</td>
              <td style={{ textAlign: 'right' }}>
                {p.price === 0 ? 'kostenlos' : `${(p.price / 100).toFixed(2).replace('.', ',')} €`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/mein-stujo/neu" className="stujo-btn">
          Jetzt Angebot einstellen
        </Link>
      </p>
    </Layout>
  );
};

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
