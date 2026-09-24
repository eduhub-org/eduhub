import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

import InvoicePaymentSection, {
  initialBillingForm,
  isBillingComplete,
} from '../InvoicePaymentSection';
import type { EmployerOrganization } from '../../lib/useEmployerOrganization';

jest.mock('next-intl', () => {
  const t = (key: string) => key;
  // Renders a rich message as "<key>" followed by its tag outputs, so the
  // contact link can be asserted.
  t.rich = (key: string, tags: Record<string, () => ReactNode>) => (
    <>
      {key}
      {Object.values(tags).map((render, index) => (
        <span key={index}>{render()}</span>
      ))}
    </>
  );
  return { useTranslations: () => t };
});

jest.mock('next/router', () => ({ useRouter: () => ({ locale: 'de' }) }));

jest.mock('@apollo/client', () => ({
  useQuery: () => ({ data: { Country: [{ code: 'DE', name_de: 'Deutschland', name_en: 'Germany' }] } }),
  gql: () => null,
}));

const organization = (overrides: Partial<EmployerOrganization> = {}): EmployerOrganization =>
  ({
    id: 1,
    name: 'Max-Planck-Institut für Evolutionsbiologie',
    logo: null,
    website: null,
    allowInvoicePayment: false,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: 'Plön',
    country: null,
    JobPostingCredits: [],
    ...overrides,
  } as EmployerOrganization);

const renderSection = (org: EmployerOrganization, props: Record<string, unknown> = {}) => {
  const onPaymentMethodChange = jest.fn();
  render(
    <InvoicePaymentSection
      organization={org}
      contactEmail="team@example.org"
      paymentMethod="CHECKOUT"
      onPaymentMethodChange={onPaymentMethodChange}
      billing={initialBillingForm(org)}
      onBillingChange={jest.fn()}
      {...props}
    />
  );
  return { onPaymentMethodChange };
};

describe('InvoicePaymentSection', () => {
  it('disables invoice payment and points to the StuJo contact when the organization is not approved', () => {
    renderSection(organization());

    const [, invoice] = screen.getAllByRole('radio');
    expect(invoice).toBeDisabled();
    expect(screen.getByText('invoice_not_enabled_hint')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'team@example.org' })).toHaveAttribute(
      'href',
      'mailto:team@example.org'
    );
  });

  it('falls back to the team name when no contact address is configured', () => {
    renderSection(organization(), { contactEmail: null });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('defaultContact')).toBeInTheDocument();
  });

  it('lets an approved organization choose invoice payment', () => {
    const { onPaymentMethodChange } = renderSection(organization({ allowInvoicePayment: true }));

    expect(screen.queryByText('invoice_not_enabled_hint')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onPaymentMethodChange).toHaveBeenCalledWith('INVOICE');
  });

  it('shows the billing form once invoice payment is chosen', () => {
    renderSection(organization({ allowInvoicePayment: true }), { paymentMethod: 'INVOICE' });

    expect(screen.getByLabelText('billing_legal_name')).toHaveValue(
      'Max-Planck-Institut für Evolutionsbiologie'
    );
    expect(screen.getByLabelText('billing_city')).toHaveValue('Plön');
    expect(screen.getByLabelText('billing_country')).toHaveValue('DE');
  });
});

describe('isBillingComplete', () => {
  it('requires name, street, postal code, city and country', () => {
    const billing = initialBillingForm(organization());
    expect(isBillingComplete(billing)).toBe(false);
    expect(
      isBillingComplete({ ...billing, addressLine1: 'August-Thienemann-Str. 2', postalCode: '24306' })
    ).toBe(true);
  });
});
