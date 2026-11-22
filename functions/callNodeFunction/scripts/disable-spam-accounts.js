#!/usr/bin/env node

/**
 * Disable spam accounts in Keycloak, reversibly.
 *
 * Selects Keycloak users that are still enabled and either
 * 1. are marked `SPAM` in EduHub (User.status), or
 * 2. never reached EduHub and have a spam-looking name (URL, spam keyword,
 *    or longer than 60 characters),
 * minus the accounts in PROTECTED_USER_IDS / PROTECTED_EMAILS.
 *
 * Disabling blocks the EduHub and chat login immediately. Nothing is deleted.
 * The report file (required with --apply) lists every selected user, and
 * --restore re-enables exactly the users in such a file. The script refuses
 * to overwrite an existing report, so use a new path for every run.
 *
 * Without --apply the script only reports what it would do (dry run).
 * (A marker attribute is not an option: the realm's user profile drops
 * attributes it does not declare.)
 *
 * Run from the functions/callNodeFunction/ directory so dependencies resolve:
 *
 *   cd functions/callNodeFunction
 *
 *   KEYCLOAK_URL=https://keycloak.opencampus.sh \
 *   KEYCLOAK_USER=keycloak \
 *   KEYCLOAK_PW=<admin-password> \
 *   HASURA_ENDPOINT=https://hasura.opencampus.sh/v1/graphql \
 *   HASURA_ADMIN_SECRET=<hasura-admin-secret> \
 *   node scripts/disable-spam-accounts.js --report spam.tsv [--apply]
 *
 *   # Undo: re-enable every user listed in a report
 *   KEYCLOAK_URL=... KEYCLOAK_USER=... KEYCLOAK_PW=... \
 *   node scripts/disable-spam-accounts.js --restore spam.tsv [--apply]
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { mergeUserPutPayload } from '../shared/keycloakUserMerge.js';

// Marked SPAM in EduHub, but used as session speaker placeholders or kept on
// purpose (reviewed 2026-11-13).
export const PROTECTED_USER_IDS = new Set([
  '1cbe7e19-057c-45c7-95ac-0d94f21cf0d7', // nix@nix.de, "N. N." speaker placeholder
  '60c56606-0b4a-4882-822e-c1a3dd25fe62', // projekt@opencampus.sh, "unbekannt" speaker placeholder
  '4807e38e-c13d-4297-b471-0a4cb4d479a9', // jonas@stackocean.io, test account
]);
// Long organization name, not spam.
export const PROTECTED_EMAILS = new Set(['bewerbung@dievilla.online']);

const SPAM_URL = /https?:|www\.|bit\.(ly|do)|\.(com|ru|club|link|xyz|top|click|info|online|site)\b/i;
const SPAM_KEYWORD = /\b(dating|sex|porn|casino|bitcoin|btc|crypto\w*|viagra|singles|nudes?|blowjob)\b/i;
const MAX_NAME_LENGTH = 60;

const DRY_RUN = !process.argv.includes('--apply');
const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : null;
};
const RESTORE_FILE = argValue('--restore');
const RESTORE = RESTORE_FILE !== null;
const REPORT_FILE = argValue('--report');
const DELAY_BETWEEN_USERS_MS = 50;
// Master-realm admin tokens expire after about a minute.
const REAUTH_AFTER_MS = 30_000;
// Disabling re-validates the whole user, and Keycloak rejects many spam names
// (URLs, emojis). Such users are disabled with these names instead; the
// originals go to <report>.renamed.tsv.
const PLACEHOLDER_NAME = { firstName: 'Spam', lastName: 'Account' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function spamNameReason(firstName, lastName) {
  const name = `${firstName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim();
  if (SPAM_URL.test(name)) return 'name-url';
  if (SPAM_KEYWORD.test(name)) return 'name-keyword';
  if (name.length > MAX_NAME_LENGTH) return 'name-long';
  return null;
}

/**
 * @param keycloakUsers  Keycloak user representations (id, email, enabled, firstName, lastName)
 * @param eduhubUserIds  Set of all User ids in EduHub
 * @param spamUserIds    Set of User ids with status SPAM in EduHub
 * @returns [{ user, reason }] for the users to disable
 */
export function selectSpamAccounts(keycloakUsers, eduhubUserIds, spamUserIds) {
  const selected = [];
  for (const user of keycloakUsers) {
    if (user.enabled === false) continue;
    if (PROTECTED_USER_IDS.has(user.id)) continue;
    if (PROTECTED_EMAILS.has((user.email || '').toLowerCase())) continue;

    if (spamUserIds.has(user.id)) {
      selected.push({ user, reason: 'eduhub-spam' });
      continue;
    }
    if (!eduhubUserIds.has(user.id)) {
      const reason = spamNameReason(user.firstName, user.lastName);
      if (reason) selected.push({ user, reason });
    }
  }
  return selected;
}

async function hasuraQuery(query) {
  const response = await fetch(process.env.HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(`Hasura error: ${JSON.stringify(result.errors)}`);
  return result.data;
}

async function keycloakAuth(kcAdminClient) {
  kcAdminClient.setConfig({ realmName: 'master' });
  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER || 'keycloak',
    password: process.env.KEYCLOAK_PW,
    grantType: 'password',
    clientId: 'admin-cli',
  });
  kcAdminClient.setConfig({ realmName: 'edu-hub' });
}

async function fetchAllKeycloakUsers(kcAdminClient) {
  const users = [];
  const PAGE_SIZE = 500;
  for (let first = 0; ; first += PAGE_SIZE) {
    const page = await kcAdminClient.users.find({ first, max: PAGE_SIZE, briefRepresentation: false });
    users.push(...page);
    if (page.length < PAGE_SIZE) return users;
  }
}

/** User ids from a report written by this script (first column, header skipped). */
export function readReportIds(content) {
  return content
    .split('\n')
    .slice(1)
    .map((line) => line.split('\t')[0].trim())
    .filter(Boolean);
}

// A single violation comes back as `error-…`; several come as a list, which
// the admin client reports only as "Network response was not OK.".
const isProfileValidationError = (err) => err?.response?.status === 400;
const oneLine = (value) => (value || '').replace(/\s+/g, ' ').trim();

/** @returns true when the user had to be renamed to pass Keycloak's profile validation */
async function setEnabled(kcAdminClient, userId, enabled, renamedFile) {
  const fullUser = await kcAdminClient.users.findOne({ id: userId });
  if (!fullUser?.username) throw new Error(`User ${userId} has no username (cannot PUT)`);
  try {
    await kcAdminClient.users.update({ id: userId }, mergeUserPutPayload(fullUser, { enabled }));
    return false;
  } catch (err) {
    if (enabled || !renamedFile || !isProfileValidationError(err)) throw err;
  }
  appendFileSync(renamedFile, `${userId}\t${oneLine(fullUser.firstName)}\t${oneLine(fullUser.lastName)}\n`);
  await kcAdminClient.users.update(
    { id: userId },
    mergeUserPutPayload(fullUser, { enabled, ...PLACEHOLDER_NAME })
  );
  return true;
}

async function main() {
  console.log(`${RESTORE ? 'Re-enable' : 'Disable'} spam accounts${DRY_RUN ? ' (DRY RUN, pass --apply to write)' : ''}`);
  console.log('---');

  const required = RESTORE ? ['KEYCLOAK_URL', 'KEYCLOAK_PW'] : ['KEYCLOAK_URL', 'KEYCLOAK_PW', 'HASURA_ENDPOINT', 'HASURA_ADMIN_SECRET'];
  for (const envVar of required) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
  if (!DRY_RUN && !RESTORE && !REPORT_FILE) {
    console.error('--apply needs --report <file>, the list --restore uses to undo it');
    process.exit(1);
  }
  // A rerun selects only the accounts still enabled, so overwriting an earlier
  // report would lose the restore list of the accounts that run disabled.
  if (REPORT_FILE && !RESTORE && existsSync(REPORT_FILE)) {
    console.error(`Report ${REPORT_FILE} already exists; pass a new path for each run`);
    process.exit(1);
  }

  const kcAdminClient = new KcAdminClient({ baseUrl: process.env.KEYCLOAK_URL, realmName: 'master' });
  await keycloakAuth(kcAdminClient);

  console.log('Loading Keycloak users...');
  const keycloakUsers = await fetchAllKeycloakUsers(kcAdminClient);
  console.log(`Loaded ${keycloakUsers.length} Keycloak users`);

  let targets;
  if (RESTORE) {
    const ids = new Set(readReportIds(readFileSync(RESTORE_FILE, 'utf8')));
    targets = keycloakUsers
      .filter((user) => ids.has(user.id) && user.enabled === false)
      .map((user) => ({ user, reason: 'restore' }));
  } else {
    console.log('Loading EduHub users...');
    const data = await hasuraQuery('query { User { id status } }');
    const eduhubUserIds = new Set(data.User.map((user) => user.id));
    const spamUserIds = new Set(data.User.filter((user) => user.status === 'SPAM').map((user) => user.id));
    console.log(`Loaded ${eduhubUserIds.size} EduHub users, ${spamUserIds.size} marked SPAM`);
    targets = selectSpamAccounts(keycloakUsers, eduhubUserIds, spamUserIds);
  }

  const byReason = {};
  for (const { reason } of targets) byReason[reason] = (byReason[reason] || 0) + 1;
  console.log('---');
  console.log(`Selected ${targets.length} users:`, byReason);

  if (REPORT_FILE && !RESTORE) {
    const lines = ['id\temail\treason\tname'];
    for (const { user, reason } of targets) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.replace(/\s+/g, ' ').trim().slice(0, 100);
      lines.push([user.id, user.email || '', reason, name].join('\t'));
    }
    writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`, { flag: 'wx' });
    console.log(`Report written to ${REPORT_FILE}`);
  }

  if (DRY_RUN) return;

  const renamedFile = RESTORE ? null : `${REPORT_FILE}.renamed.tsv`;
  let done = 0;
  let renamed = 0;
  let errors = 0;
  let lastAuth = Date.now();
  for (const [index, { user }] of targets.entries()) {
    if (Date.now() - lastAuth > REAUTH_AFTER_MS) {
      await keycloakAuth(kcAdminClient);
      lastAuth = Date.now();
    }
    try {
      if (await setEnabled(kcAdminClient, user.id, RESTORE, renamedFile)) renamed++;
      done++;
    } catch (err) {
      errors++;
      console.error(`  ERROR ${user.id}: ${err.message}`);
    }
    if ((index + 1) % 500 === 0) {
      console.log(`  ${index + 1}/${targets.length} processed (${done} ok, ${renamed} renamed, ${errors} errors)`);
    }
    await sleep(DELAY_BETWEEN_USERS_MS);
  }

  console.log('---');
  console.log(`Done. ${RESTORE ? 'Re-enabled' : 'Disabled'}: ${done}, Errors: ${errors}`);
  if (renamed) console.log(`${renamed} renamed to "Spam Account"; original names in ${renamedFile}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
