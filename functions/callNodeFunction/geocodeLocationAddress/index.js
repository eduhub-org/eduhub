import { GraphQLClient } from 'graphql-request';

/**
 * Looks up the coordinates of a location address from its structured address
 * with OpenStreetMap Nominatim and stores them. Called from a button in the
 * location address settings (super admins), so the volume stays far below
 * Nominatim's usage policy (max. 1 request/s, identifying User-Agent).
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'EduHub/1.0 (https://edu.opencampus.sh; info@opencampus.sh)';

const GET_LOCATION_ADDRESS = `
  query GeocodeLocationAddress($id: Int!) {
    LocationAddress_by_pk(id: $id) {
      id
      street
      zipCode
      city
      country
    }
  }
`;

const UPDATE_COORDINATES = `
  mutation SetLocationAddressCoordinates($id: Int!, $latitude: numeric!, $longitude: numeric!) {
    update_LocationAddress_by_pk(pk_columns: { id: $id }, _set: { latitude: $latitude, longitude: $longitude }) {
      id
    }
  }
`;

export default async function geocodeLocationAddress(req, logger, { fetchImpl = globalThis.fetch } = {}) {
  if (req.body?.session_variables?.['x-hasura-role'] !== 'admin') {
    return { success: false, error: 'Only super admins can geocode location addresses' };
  }

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
  const id = Number(req.body.input?.locationAddressId);
  const locationAddress = (await client.request(GET_LOCATION_ADDRESS, { id }))?.LocationAddress_by_pk;
  if (!locationAddress) return { success: false, error: 'Location address not found' };
  if (!locationAddress.street || !locationAddress.city) {
    return { success: false, error: 'Straße und Stadt werden für die Koordinatensuche benötigt.' };
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('street', locationAddress.street);
  url.searchParams.set('city', locationAddress.city);
  if (locationAddress.zipCode) url.searchParams.set('postalcode', locationAddress.zipCode);
  url.searchParams.set('country', locationAddress.country || 'Deutschland');

  const response = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', 'Accept-Language': 'de' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    logger.warn(`Nominatim answered ${response.status} for location address ${id}`);
    return { success: false, error: `Koordinatensuche fehlgeschlagen (${response.status}).` };
  }

  const [hit] = await response.json();
  if (!hit) return { success: false, error: 'Zu dieser Adresse wurden keine Koordinaten gefunden.' };

  const latitude = Number(Number(hit.lat).toFixed(6));
  const longitude = Number(Number(hit.lon).toFixed(6));
  await client.request(UPDATE_COORDINATES, { id, latitude, longitude });

  return { success: true, latitude, longitude, displayName: hit.display_name ?? null, error: null };
}
