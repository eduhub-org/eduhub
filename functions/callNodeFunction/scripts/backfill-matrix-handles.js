#!/usr/bin/env node

/**
 * Backfill matrix_user_handle and picture for all existing users.
 *
 * This script:
 * 1. Fetches all user pictures from Hasura (batch)
 * 2. Iterates all Keycloak users in the edu-hub realm
 * 3. For each user missing matrix_user_handle or picture, computes/resolves
 *    and sets them as Keycloak attributes
 * 4. Stores matrixUserHandle in the Hasura User table
 *
 * Run from the functions/callNodeFunction/ directory so dependencies resolve:
 *
 *   cd functions/callNodeFunction
 *
 *   # Local:
 *   KEYCLOAK_URL=http://localhost:28080 \
 *   KEYCLOAK_USER=admin \
 *   KEYCLOAK_PW=admin \
 *   HASURA_ENDPOINT=http://localhost:8080/v1/graphql \
 *   HASURA_ADMIN_SECRET=myadminsecretkey \
 *   STORAGE_BUCKET_PUBLIC_URL=http://localhost:4001/emulated-bucket \
 *   node scripts/backfill-matrix-handles.js [--dry-run]
 *
 *   # Production:
 *   KEYCLOAK_URL=https://keycloak.opencampus.sh \
 *   KEYCLOAK_USER=<admin-user> \
 *   KEYCLOAK_PW=<admin-password> \
 *   HASURA_ENDPOINT=https://hasura.opencampus.sh/v1/graphql \
 *   HASURA_ADMIN_SECRET=<hasura-admin-secret> \
 *   STORAGE_BUCKET_PUBLIC_URL=https://storage.googleapis.com/<project-id> \
 *   node scripts/backfill-matrix-handles.js [--dry-run]
 */

import KcAdminClient from '@keycloak/keycloak-admin-client';

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_BETWEEN_USERS_MS = 100;
const DELAY_BETWEEN_BATCHES_MS = 500;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeMatrixHandle(firstName, lastName, userId) {
  const sanitize = (input) => {
    const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.toLowerCase().replace(/[^a-z0-9._\-]/g, '');
  };
  const first = sanitize(firstName || 'user');
  const last = sanitize(lastName || 'user');
  const uuidPrefix = (userId || '').replace(/-/g, '').substring(0, 6);
  return `${first}.${last}.${uuidPrefix}`;
}

function resolvePictureUrl(picturePath) {
  if (!picturePath) return null;
  if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
    return picturePath;
  }
  if (picturePath.startsWith('public/') || picturePath.includes('/public/')) {
    const bucketUrl = process.env.STORAGE_BUCKET_PUBLIC_URL;
    if (!bucketUrl) return null;
    return `${bucketUrl}/${picturePath}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hasura helpers
// ---------------------------------------------------------------------------

async function hasuraQuery(query, variables = {}) {
  const response = await fetch(process.env.HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) {
    throw new Error(`Hasura error: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

async function fetchAllUserPictures() {
  const data = await hasuraQuery(`
    query {
      User {
        id
        picture
      }
    }
  `);
  const map = new Map();
  for (const user of data.User) {
    map.set(user.id, user.picture);
  }
  return map;
}

async function updateHasuraUser(userId, matrixUserHandle) {
  await hasuraQuery(
    `mutation($id: uuid!, $handle: String!) {
      update_User_by_pk(pk_columns: {id: $id}, _set: {matrixUserHandle: $handle}) { id }
    }`,
    { id: userId, handle: matrixUserHandle }
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Backfill matrix_user_handle + picture${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  const requiredEnvVars = [
    'KEYCLOAK_URL', 'KEYCLOAK_PW',
    'HASURA_ENDPOINT', 'HASURA_ADMIN_SECRET',
    'STORAGE_BUCKET_PUBLIC_URL',
  ];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // 1. Fetch all pictures from Hasura in one batch
  console.log('Fetching user pictures from Hasura...');
  const pictureMap = await fetchAllUserPictures();
  console.log(`Loaded ${pictureMap.size} users from Hasura`);
  console.log('---');

  // 2. Authenticate with Keycloak
  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: 'master',
  });

  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER || 'keycloak',
    password: process.env.KEYCLOAK_PW,
    grantType: 'password',
    clientId: 'admin-cli',
  });
  kcAdminClient.setConfig({ realmName: 'edu-hub' });

  // 3. Iterate all Keycloak users
  const PAGE_SIZE = 100;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  while (true) {
    const users = await kcAdminClient.users.find({ first: offset, max: PAGE_SIZE });
    if (!users || users.length === 0) break;

    for (const user of users) {
      totalProcessed++;

      const existingHandle = user.attributes?.matrix_user_handle?.[0];
      const existingPicture = user.attributes?.picture?.[0];

      const hasuraPicturePath = pictureMap.get(user.id) || null;
      const resolvedPictureUrl = resolvePictureUrl(hasuraPicturePath);

      const needsHandle = !existingHandle;
      const needsPicture = resolvedPictureUrl && existingPicture !== resolvedPictureUrl;

      if (!needsHandle && !needsPicture) {
        totalSkipped++;
        continue;
      }

      const handle = existingHandle || computeMatrixHandle(user.firstName, user.lastName, user.id);
      const changes = [];
      if (needsHandle) changes.push(`handle=${handle}`);
      if (needsPicture) changes.push(`picture=${resolvedPictureUrl}`);

      console.log(`[${totalProcessed}] ${user.id} (${user.firstName} ${user.lastName}) -> ${changes.join(', ')}`);

      if (!DRY_RUN) {
        let attempt = 0;
        while (attempt < MAX_RETRIES) {
          try {
            const updatedAttrs = { ...user.attributes };
            if (needsHandle) updatedAttrs.matrix_user_handle = [handle];
            if (needsPicture) updatedAttrs.picture = [resolvedPictureUrl];

            await kcAdminClient.users.update(
              { id: user.id },
              { attributes: updatedAttrs }
            );

            if (needsHandle) {
              await updateHasuraUser(user.id, handle);
            }

            totalUpdated++;
            break;
          } catch (err) {
            attempt++;
            if (attempt >= MAX_RETRIES) {
              console.error(`  ERROR (after ${MAX_RETRIES} attempts): ${err.message}`);
              totalErrors++;
            } else {
              const backoff = DELAY_BETWEEN_USERS_MS * Math.pow(2, attempt);
              console.warn(`  Retry ${attempt}/${MAX_RETRIES} after ${backoff}ms: ${err.message}`);
              await sleep(backoff);
            }
          }
        }
        await sleep(DELAY_BETWEEN_USERS_MS);
      } else {
        totalUpdated++;
      }
    }

    if (users.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;

    await sleep(DELAY_BETWEEN_BATCHES_MS);

    if (offset % 500 === 0) {
      await kcAdminClient.auth({
        username: process.env.KEYCLOAK_USER || 'keycloak',
        password: process.env.KEYCLOAK_PW,
        grantType: 'password',
        clientId: 'admin-cli',
      });
      kcAdminClient.setConfig({ realmName: 'edu-hub' });
    }
  }

  console.log('---');
  console.log(`Done. Processed: ${totalProcessed}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
