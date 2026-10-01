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

const makeClient = () => {
  const request = jest.fn<Promise<unknown>, [unknown, Record<string, unknown>]>(async () => ({
    update_Organization_many: [],
  }));
  const updates = () => request.mock.calls.map(([, variables]) => variables.updates);
  return { client: { request } as unknown as GraphQLClient, request, updates };
};

const isEmpty = (field: string) => ({ _or: [{ [field]: { _is_null: true } }, { [field]: { _eq: '' } }] });
const byId = { id: { _eq: 3 } };

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
  it('writes each field only where it is still empty, in one request', async () => {
    const { client, updates } = makeClient();

    await fillOrganizationBillingFromCheckout(client, 3, fullDetails);

    expect(updates()).toEqual([
      [
        {
          where: { _and: [byId, isEmpty('legalName')] },
          _set: { legalName: 'MPG&E Handel und Service GmbH' },
        },
        { where: { _and: [byId, isEmpty('vatId')] }, _set: { vatId: 'DE123456789' } },
        {
          // The address only lands on an organization without any address.
          where: {
            _and: [
              byId,
              isEmpty('addressLine1'),
              isEmpty('addressLine2'),
              isEmpty('postalCode'),
              isEmpty('city'),
              isEmpty('country'),
            ],
          },
          _set: { addressLine1: 'Musterstr. 1', postalCode: '24103', city: 'Kiel', country: 'DE' },
        },
      ],
    ]);
  });

  it('does not save a partial address a card payment collected', async () => {
    const { client, request } = makeClient();

    await fillOrganizationBillingFromCheckout(client, 3, {
      address: { line1: null, line2: null, postal_code: '24103', city: null, country: 'DE', state: null },
    });

    expect(request).not.toHaveBeenCalled();
  });

  it('sends nothing when Checkout collected nothing', async () => {
    const { client, request } = makeClient();

    await fillOrganizationBillingFromCheckout(client, 3, null);

    expect(request).not.toHaveBeenCalled();
  });
});
