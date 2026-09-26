import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { ACTION_ROLE_CONTEXT, COUNTRY_OPTIONS } from '../lib/employer';
import type { EmployerOrganization } from '../lib/useEmployerOrganization';

export type PaymentMethod = 'CHECKOUT' | 'INVOICE';

export type BillingForm = {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  vatId: string;
  reference: string;
};

const REQUIRED_FIELDS: Array<keyof BillingForm> = [
  'legalName',
  'addressLine1',
  'postalCode',
  'city',
  'country',
];

/** Pre-fills the invoice address from what the organization already has. */
export const initialBillingForm = (organization: EmployerOrganization | null): BillingForm => ({
  legalName: organization?.name ?? '',
  addressLine1: organization?.addressLine1 ?? '',
  addressLine2: organization?.addressLine2 ?? '',
  postalCode: organization?.postalCode ?? '',
  city: organization?.city ?? '',
  country: organization?.country ?? 'DE',
  vatId: '',
  reference: '',
});

export const isBillingComplete = (billing: BillingForm) =>
  REQUIRED_FIELDS.every((key) => billing[key].trim() !== '');

type Props = {
  organization: EmployerOrganization;
  /** The StuJo team's address, who approve invoice payment per organization. */
  contactEmail: string | null;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  billing: BillingForm;
  onBillingChange: (billing: BillingForm) => void;
  disabled?: boolean;
};

/**
 * Payment choice in the order box of a paid posting: online (Stripe Checkout)
 * or "Kauf auf Rechnung" (bank transfer invoice). The invoice option is only
 * selectable for organizations the StuJo team approved; everyone else sees
 * how to ask for it.
 */
const InvoicePaymentSection: FC<Props> = ({
  organization,
  contactEmail,
  paymentMethod,
  onPaymentMethodChange,
  billing,
  onBillingChange,
  disabled = false,
}) => {
  const t = useTranslations('meinStujo.NeuesAngebot');
  const tMein = useTranslations('meinStujo');
  const { locale } = useRouter();
  const invoiceAllowed = organization.allowInvoicePayment === true;

  const { data: countryData } = useQuery(COUNTRY_OPTIONS, {
    context: ACTION_ROLE_CONTEXT,
    skip: !invoiceAllowed || paymentMethod !== 'INVOICE',
  });

  const field = (key: keyof BillingForm, label: string, options?: { optional?: boolean }) => (
    <label className="stujo-field">
      <span>
        {label}
        {options?.optional ? ` (${t('optional')})` : ''}
      </span>
      <input
        type="text"
        value={billing[key]}
        disabled={disabled}
        required={!options?.optional}
        onChange={(event) => onBillingChange({ ...billing, [key]: event.target.value })}
      />
    </label>
  );

  return (
    <fieldset className="stujo-payment-methods" disabled={disabled}>
      <legend>{t('payment_method_heading')}</legend>
      <label className="stujo-consent">
        <input
          type="radio"
          name="paymentMethod"
          checked={paymentMethod === 'CHECKOUT'}
          onChange={() => onPaymentMethodChange('CHECKOUT')}
        />
        <span>{t('payment_method_online')}</span>
      </label>
      <label className="stujo-consent">
        <input
          type="radio"
          name="paymentMethod"
          checked={paymentMethod === 'INVOICE'}
          disabled={!invoiceAllowed}
          onChange={() => onPaymentMethodChange('INVOICE')}
        />
        <span>{t('payment_method_invoice')}</span>
      </label>

      {!invoiceAllowed && (
        <p className="stujo-muted stujo-payment-hint">
          {t.rich('invoice_not_enabled_hint', {
            contact: () =>
              contactEmail ? (
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              ) : (
                tMein('defaultContact')
              ),
          })}
        </p>
      )}

      {invoiceAllowed && paymentMethod === 'INVOICE' && (
        <div className="stujo-form stujo-billing-form">
          <p className="stujo-muted stujo-payment-hint">{t('invoice_payment_hint')}</p>
          {field('legalName', t('billing_legal_name'))}
          {field('addressLine1', t('billing_address_line1'))}
          {field('addressLine2', t('billing_address_line2'), { optional: true })}
          <div className="stujo-form-row">
            {field('postalCode', t('billing_postal_code'))}
            {field('city', t('billing_city'))}
          </div>
          <label className="stujo-field">
            <span>{t('billing_country')}</span>
            <select
              value={billing.country}
              disabled={disabled}
              onChange={(event) => onBillingChange({ ...billing, country: event.target.value })}
            >
              {(countryData?.Country ?? [{ code: billing.country, name_de: billing.country, name_en: billing.country }]).map(
                (country: { code: string; name_de: string; name_en: string }) => (
                  <option key={country.code} value={country.code}>
                    {locale === 'en' ? country.name_en : country.name_de}
                  </option>
                )
              )}
            </select>
          </label>
          {field('vatId', t('billing_vat_id'), { optional: true })}
          {field('reference', t('billing_reference'), { optional: true })}
        </div>
      )}
    </fieldset>
  );
};

export default InvoicePaymentSection;
