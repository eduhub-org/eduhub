/**
 * @jest-environment node
 */
import type { GraphQLClient } from 'graphql-request';

import { billingFromCheckout, fillOrganizationBillingFromCheckout } from './stripeJobPosting';

const fullDetails = {
  business_name: ' MPG&E Handel und Service GmbH ',
  address: {
    line1: 'Musterstr. 1',
    line2: '',
    postal_code: '24103',
    city: 'Kiel',
    country: 'de',
    state: null,
  },
  tax_ids: [{ type: 'eu_vat', value: 'de 123 456 789' }],
};

const makeClient = (organization: Record<string, unknown> | null) => {
  const calls: Array<{ query: string; variables: Record<string, unknown> }> = [];
  const request = jest.fn(async (query: unknown, variables: Record<string, unknown>) => {
    const text = String((query as { loc?: { source: { body: string } } })?.loc?.source.body ?? query);
    calls.push({ query: text, variables });
    if (text.includes('GetOrganizationBillingForWebhook')) return { Organization_by_pk: organization };
    return {};
  });
  const updates = () =>
    calls.filter((call) => call.query.includes('FillOrganizationBillingFromCheckout')).map((call) => call.variables);
  return { client: { request } as unknown as GraphQLClient, calls, updates };
};

const emptyOrganization = {
  id: 3,
  legalName: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  country: null,
  vatId: null,
};

describe('billingFromCheckout', () => {
  it('maps and normalizes the collected details, dropping empty values', () => {
    expect(billingFromCheckout(fullDetails)).toEqual({
      legalName: 'MPG&E Handel und Service GmbH',
      addressLine1: 'Musterstr. 1',
      postalCode: '24103',
      city: 'Kiel',
      country: 'DE',
      vatId: 'DE123456789',
    });
  });

  it('ignores tax IDs other than an EU VAT ID', () => {
    expect(billingFromCheckout({ tax_ids: [{ type: 'ch_vat', value: 'CHE-123' }] })).toEqual({});
  });

  it('copes with no details at all', () => {
    expect(billingFromCheckout(null)).toEqual({});
  });
});

describe('fillOrganizationBillingFromCheckout', () => {
  it('fills an organization without billing data', async () => {
    const { client, updates } = makeClient(emptyOrganization);

    await fillOrganizationBillingFromCheckout(client, 3, fullDetails);

    expect(updates()).toEqual([
      {
        id: 3,
        set: {
          legalName: 'MPG&E Handel und Service GmbH',
          vatId: 'DE123456789',
          addressLine1: 'Musterstr. 1',
          postalCode: '24103',
          city: 'Kiel',
          country: 'DE',
        },
      },
    ]);
  });

  it('never overwrites what the organization already has, and keeps its address whole', async () => {
    const { client, updates } = makeClient({
      ...emptyOrganization,
      legalName: 'MPG&E GmbH',
      addressLine1: 'Alte Str. 5',
    });

    await fillOrganizationBillingFromCheckout(client, 3, fullDetails);

    expect(updates()).toEqual([{ id: 3, set: { vatId: 'DE123456789' } }]);
  });

  it('does not save a partial address a card payment collected', async () => {
    const { client, calls } = makeClient(emptyOrganization);

    await fillOrganizationBillingFromCheckout(client, 3, {
      address: { line1: null, line2: null, postal_code: '24103', city: null, country: 'DE', state: null },
    });

    expect(calls).toEqual([]);
  });

  it('writes nothing when there is nothing new', async () => {
    const { client, updates } = makeClient({
      id: 3,
      legalName: 'MPG&E Handel und Service GmbH',
      addressLine1: 'Musterstr. 1',
      addressLine2: null,
      postalCode: '24103',
      city: 'Kiel',
      country: 'DE',
      vatId: 'DE123456789',
    });

    await fillOrganizationBillingFromCheckout(client, 3, fullDetails);

    expect(updates()).toEqual([]);
  });
});
