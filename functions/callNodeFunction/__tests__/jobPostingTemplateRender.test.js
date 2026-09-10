import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyConditionalBlocks,
  buildJobPostingMailVars,
  replaceJobPostingVariables,
} from '../publishJobPosting/index.js';

/**
 * Renders the shipped JOB_POSTING_PUBLISHED template out of its migration.
 *
 * The template is data, not code, so these are the only tests that can catch a
 * conditional block that was left unbalanced or a claim that contradicts what
 * was actually sent.
 */
const MIGRATION = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../backend/migrations/default',
  '1788200000001_update_job_posting_published_mail_template/up.sql'
);

const sql = fs.readFileSync(MIGRATION, 'utf8');
const template = sql.slice(sql.indexOf('"content" = \'') + 13, sql.lastIndexOf("'\nWHERE"));

const posting = {
  id: 42,
  title: 'Werkstudent Frontend',
  type: 'WORKING_STUDENT',
  termsAcceptedAt: '2026-08-29T10:00:00Z',
  Organization: { name: 'Coding Werkstatt' },
};

const invoiceWith = (hostedUrl) => ({
  number: 'VGD1VIPO-0001',
  date: new Date('2026-08-29'),
  hostedUrl,
  netTotal: 50,
  vatTotal: 10,
  grossTotal: 60,
  currency: 'EUR',
  paid: true,
});

function render(flags, invoice) {
  const vars = buildJobPostingMailVars(posting, {
    expiresAt: new Date('2026-10-23'),
    publishedAt: new Date('2026-08-29'),
    paymentDescription: invoice ? '0,60 € (bezahlt)' : 'kostenlos',
    invoice,
  });
  return replaceJobPostingVariables(applyConditionalBlocks(template, flags), vars);
}

const SCENARIOS = [
  ['paid, PDF attached and link', { Invoice: true, InvoicePdf: true, InvoiceLink: true, InvoicePending: false, TermsAccepted: true }, invoiceWith('https://invoice.stripe.com/i/x')],
  ['sweep, link but no PDF', { Invoice: true, InvoicePdf: false, InvoiceLink: true, InvoicePending: false, TermsAccepted: true }, invoiceWith('https://invoice.stripe.com/i/x')],
  ['sweep, neither PDF nor link', { Invoice: true, InvoicePdf: false, InvoiceLink: false, InvoicePending: true, TermsAccepted: true }, invoiceWith(null)],
  ['free / credit', { Invoice: false, InvoicePdf: false, InvoiceLink: false, InvoicePending: false, TermsAccepted: false }, null],
];

describe('JOB_POSTING_PUBLISHED template', () => {
  it.each(SCENARIOS)('leaves no unresolved placeholder or marker: %s', (_label, flags, invoice) => {
    const html = render(flags, invoice);
    expect(html).not.toMatch(/\[#if:/);
    expect(html).not.toMatch(/\[\/if:/);
    expect(html).not.toMatch(/\[[A-Za-z]+:[A-Za-z]+\]/);
  });

  it.each(SCENARIOS)('only promises an attached PDF when one is attached: %s', (_label, flags, invoice) => {
    const html = render(flags, invoice);
    expect(/liegt dieser E-Mail als PDF bei/.test(html)).toBe(flags.InvoicePdf);
  });

  it('tells the employer the document follows when neither PDF nor link exists', () => {
    const html = render(SCENARIOS[2][1], SCENARIOS[2][2]);
    expect(html).toMatch(/in Kürze separat/);
  });

  it('omits the whole invoice section for free and credit postings', () => {
    const html = render(SCENARIOS[3][1], SCENARIOS[3][2]);
    expect(html).not.toMatch(/Rechnung/);
    expect(html).toMatch(/kostenlos/);
  });

  it('names the terms, and the acceptance date only when one is recorded', () => {
    expect(render(SCENARIOS[0][1], SCENARIOS[0][2])).toMatch(/29\. August 2026 bei der Veröffentlichung zugestimmt/);
    const free = render(SCENARIOS[3][1], SCENARIOS[3][2]);
    expect(free).toMatch(/Allgemeinen Geschäftsbedingungen/);
    expect(free).not.toMatch(/zugestimmt/);
  });
});
