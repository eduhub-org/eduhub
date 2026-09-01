import { buildJobPostingMailVars, formatJobPostingAmount } from '../publishJobPosting/index.js';

const posting = {
  id: 42,
  title: 'Werkstudent Frontend',
  type: 'WORKING_STUDENT',
  termsAcceptedAt: null,
  Organization: { name: 'Coding Werkstatt' },
};

const paidInvoice = {
  number: 'VGD1VIPO-0001',
  date: new Date('2026-08-29'),
  hostedUrl: 'https://invoice.stripe.com/i/x',
  netTotal: 50,
  vatTotal: 10,
  grossTotal: 60,
  currency: 'EUR',
  paid: true,
};

describe('buildJobPostingMailVars', () => {
  it('produces the same key set with and without an invoice', () => {
    // The replacer only substitutes keys it is handed, so a key present on the
    // paid path but missing on the free path would reach the employer as a
    // literal "[Invoice:Number]".
    const free = buildJobPostingMailVars(posting, {
      expiresAt: new Date('2026-10-23'),
      publishedAt: new Date('2026-08-29'),
      paymentDescription: 'kostenlos',
    });
    const paid = buildJobPostingMailVars(posting, {
      expiresAt: new Date('2026-10-23'),
      publishedAt: new Date('2026-08-29'),
      paymentDescription: '0,60 € (bezahlt)',
      invoice: paidInvoice,
    });
    expect(Object.keys(free).sort()).toEqual(Object.keys(paid).sort());
  });

  it('leaves every invoice variable empty on the free path', () => {
    const free = buildJobPostingMailVars(posting, {
      expiresAt: new Date('2026-10-23'),
      publishedAt: new Date('2026-08-29'),
      paymentDescription: 'kostenlos',
    });
    for (const [key, value] of Object.entries(free)) {
      if (key.startsWith('[Invoice:')) expect(value).toBe('');
    }
  });

  it('derives the VAT rate from the amounts', () => {
    const paid = buildJobPostingMailVars(posting, {
      expiresAt: null,
      publishedAt: null,
      paymentDescription: '',
      invoice: paidInvoice,
    });
    expect(paid['[Invoice:VatRate]']).toBe('20');
    expect(paid['[Invoice:GrossTotal]']).toBe('0,60 €');
    expect(paid['[Invoice:PaymentStatus]']).toBe('bezahlt');
  });

  it('renders the invoice date, not the moment the mail is sent', () => {
    // On the invoice.finalized and sweep paths the mail is queued minutes to
    // days after the invoice was raised, and the PDF shows the invoice date.
    const vars = buildJobPostingMailVars(posting, {
      expiresAt: null,
      publishedAt: null,
      paymentDescription: '',
      invoice: { ...paidInvoice, date: new Date('2026-01-15') },
    });
    expect(vars['[Invoice:Date]']).toBe('15. Januar 2026');
  });

  it('leaves the invoice date empty rather than throwing when it is missing', () => {
    // This runs inside the publish action; a throw here would fail the publish.
    const { date, ...noDate } = paidInvoice;
    expect(() =>
      buildJobPostingMailVars(posting, {
        expiresAt: null,
        publishedAt: null,
        paymentDescription: '',
        invoice: noDate,
      })
    ).not.toThrow();
    const vars = buildJobPostingMailVars(posting, {
      expiresAt: null,
      publishedAt: null,
      paymentDescription: '',
      invoice: noDate,
    });
    expect(vars['[Invoice:Date]']).toBe('');
    expect(vars['[Invoice:Number]']).toBe('VGD1VIPO-0001');
  });

  it('never divides by zero when the net total is zero', () => {
    const vars = buildJobPostingMailVars(posting, {
      expiresAt: null,
      publishedAt: null,
      paymentDescription: '',
      invoice: { ...paidInvoice, netTotal: 0, vatTotal: 0 },
    });
    expect(vars['[Invoice:VatRate]']).toBe('');
  });

  it('renders the human label for the posting type, not the raw enum', () => {
    const vars = buildJobPostingMailVars(posting, {
      expiresAt: null,
      publishedAt: null,
      paymentDescription: '',
    });
    expect(vars['[JobPosting:Type]']).toBe('Studentenjob');
  });

  it('falls back to the raw value for an unknown type', () => {
    const vars = buildJobPostingMailVars(
      { ...posting, type: 'SOMETHING_NEW' },
      { expiresAt: null, publishedAt: null, paymentDescription: '' }
    );
    expect(vars['[JobPosting:Type]']).toBe('SOMETHING_NEW');
  });
});

describe('formatJobPostingAmount', () => {
  it('formats euro cents in German notation', () => {
    expect(formatJobPostingAmount(60, 'EUR')).toBe('0,60 €');
    expect(formatJobPostingAmount(123456, 'EUR')).toBe('1234,56 €');
  });

  it('falls back to the currency code for non-euro', () => {
    expect(formatJobPostingAmount(100, 'chf')).toBe('1,00 CHF');
  });
});
