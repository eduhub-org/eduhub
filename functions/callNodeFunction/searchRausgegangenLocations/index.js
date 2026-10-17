import { GraphQLClient } from 'graphql-request';
import { decryptOrganizationCredential } from '../lib/organizationCredential.js';
import { createRausgegangenClient } from '../lib/rausgegangen.js';

/**
 * Lists rausgegangen.de venues that may be the same place as a location
 * address, so a super admin can link it instead of letting the sync create a
 * duplicate. Location addresses are shared by all organizations; the search
 * runs with the key of any organization that has the feature and a key.
 */

const GET_LOCATION_ADDRESS = `
  query RausgegangenSearchLocationAddress($id: Int!) {
    LocationAddress_by_pk(id: $id) {
      id
      shortLabel
      street
      zipCode
      city
    }
    Organization(
      where: {
        rausgegangenApiKeyConfigured: { _eq: true }
        Features: { feature: { _eq: RAUSGEGANGEN } }
      }
      order_by: { id: asc }
      limit: 1
    ) {
      rausgegangenApiKeyEncrypted
    }
  }
`;

const toResult = (location) => ({
  id: String(location.id),
  title: location.title ?? '',
  street: location.address_street ?? null,
  zipCode: location.address_zipcode ?? null,
  city: location.address_city ?? null,
});

async function search(req, logger) {
  if (req.body?.session_variables?.['x-hasura-role'] !== 'admin') {
    return { success: false, error: 'Only super admins can search Rausgegangen locations', locations: [] };
  }

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
  const data = await client.request(GET_LOCATION_ADDRESS, { id: Number(req.body.input?.locationAddressId) });
  const locationAddress = data.LocationAddress_by_pk;
  const encryptedKey = data.Organization?.[0]?.rausgegangenApiKeyEncrypted;

  if (!locationAddress) return { success: false, error: 'Location address not found', locations: [] };
  if (!encryptedKey) {
    return {
      success: false,
      error: 'Keine Organisation mit freigeschalteter Rausgegangen-Funktion und API-Schlüssel.',
      locations: [],
    };
  }

  const rausgegangen = createRausgegangenClient({
    apiKey: decryptOrganizationCredential(encryptedKey, 'Rausgegangen API key'),
    logger,
  });

  // By address first (finds the venue under any name), then by name in the city.
  const byAddress = locationAddress.street
    ? await rausgegangen.searchLocations({ city: locationAddress.city, street: locationAddress.street })
    : [];
  const byName = await rausgegangen.searchLocations({ q: locationAddress.shortLabel, city: locationAddress.city });

  const seen = new Set();
  const locations = [...byAddress, ...byName]
    .filter((location) => location?.id && !seen.has(location.id) && seen.add(location.id))
    .slice(0, 20)
    .map(toResult);

  return { success: true, error: null, locations };
}

/** Always answers in the action's output shape, so a failure reaches the dialog as a message. */
export default async function searchRausgegangenLocations(req, logger) {
  try {
    return await search(req, logger);
  } catch (error) {
    logger.error('Rausgegangen location search failed', { error: error.message });
    const message = /decrypt|authenticate data|invalid format/i.test(error.message)
      ? 'Der Rausgegangen-API-Schlüssel konnte nicht entschlüsselt werden. Bitte hinterlege ihn neu.'
      : `Die Suche auf Rausgegangen ist fehlgeschlagen: ${error.message}`;
    return { success: false, error: message, locations: [] };
  }
}
