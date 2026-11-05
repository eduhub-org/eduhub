#!/usr/bin/env node

/**
 * Tell every account holder once that the privacy policy changed materially
 * (new purposes, recipients or legal bases). Process: docs/LEGAL_DOCUMENTS.md.
 *
 * Queues the PRIVACY_POLICY_UPDATED mail for every ACTIVE and GUEST user.
 * Before running it, edit that template in the admin UI (Settings -> Emails)
 * and replace the placeholder bullet with what changed.
 *
 *   (no flag)   reports how many mails it would queue; changes nothing
 *   --send      queues them
 *
 * --version is the PRIVACY_NOTICE_VERSION the mail announces (YYYY-MM-DD). It
 * is recorded in MailLog.metadata, so a second run for the same version skips
 * everyone already mailed and can safely resume an interrupted run.
 *
 * Run from the functions/callNodeFunction/ directory so dependencies resolve:
 *
 *   cd functions/callNodeFunction
 *
 *   HASURA_ENDPOINT=https://hasura.opencampus.sh/v1/graphql \
 *   HASURA_ADMIN_SECRET=<hasura-admin-secret> \
 *   FRONTEND_URL=https://edu.opencampus.sh \
 *   node scripts/send-privacy-policy-update.js --version 2026-11-05 [--send]
 */

import { GraphQLClient, gql } from 'graphql-request';

import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

const TEMPLATE_TYPE = 'PRIVACY_POLICY_UPDATED';
const PAGE_SIZE = 500;
// queueEmail's answers for an address it will never accept.
const INVALID_ADDRESS_KEYS = new Set(['INVALID_EMAIL_FORMAT', 'INVALID_RECIPIENT_EMAIL']);

const GET_RECIPIENTS = gql`
  query GetPrivacyUpdateRecipients($offset: Int!, $limit: Int!) {
    User(
      where: { status: { _in: [ACTIVE, GUEST] }, email: { _is_null: false } }
      order_by: { created_at: asc }
      offset: $offset
      limit: $limit
    ) {
      id
      email
      firstName
      lastName
      status
    }
  }
`;

const GET_ALREADY_MAILED = gql`
  query GetPrivacyUpdateAlreadyMailed($metadata: jsonb!) {
    MailLog(where: { metadata: { _contains: $metadata } }) {
      to
    }
  }
`;

/**
 * Reads `--version YYYY-MM-DD` from the command line.
 *
 * @param {string[]} argv - process.argv
 * @returns {string|null} The version, or null when missing or malformed.
 */
export function parseVersion(argv) {
  const index = argv.indexOf('--version');
  const value = index >= 0 ? argv[index + 1] : null;
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/**
 * The users who still need the mail for this version.
 *
 * @param {Array<{email: string}>} users - Candidate recipients.
 * @param {Set<string>} alreadyMailed - Lower-cased addresses already queued for this version.
 * @returns {Array<{email: string}>} Users not mailed yet, each address once.
 */
export function pendingRecipients(users, alreadyMailed) {
  const seen = new Set(alreadyMailed);
  return users.filter((user) => {
    const email = user.email?.trim().toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

async function main() {
  const send = process.argv.includes('--send');
  const version = parseVersion(process.argv);
  if (!version) {
    console.error('Usage: node scripts/send-privacy-policy-update.js --version YYYY-MM-DD [--send]');
    process.exit(1);
  }
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    console.error('HASURA_ENDPOINT and HASURA_ADMIN_SECRET are required.');
    process.exit(1);
  }

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
  const metadata = { type: TEMPLATE_TYPE, version };

  const users = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { User } = await client.request(GET_RECIPIENTS, { offset, limit: PAGE_SIZE });
    users.push(...User);
    if (User.length < PAGE_SIZE) break;
  }
  const { MailLog } = await client.request(GET_ALREADY_MAILED, { metadata });
  const alreadyMailed = new Set(MailLog.map((mail) => mail.to.trim().toLowerCase()));
  const pending = pendingRecipients(users, alreadyMailed);

  console.log(`${users.length} active/guest users, ${alreadyMailed.size} already mailed for ${version}, ${pending.length} to queue.`);
  if (!send) {
    console.log('Dry run - nothing queued. Re-run with --send to queue the mails.');
    return;
  }

  const logger = { info: () => undefined, debug: () => undefined, warn: console.warn, error: console.error };
  let queued = 0;
  let failed = 0;
  let skipped = 0;
  for (const user of pending) {
    const result = await queueEmail({
      templateType: TEMPLATE_TYPE,
      variableReplacer: createVariableReplacer({ user }, () => ''),
      recipientEmail: user.email.trim(),
      recipientUser: user,
      metadata,
      client,
      logger,
    });
    if (result.success) {
      queued += 1;
    } else if (INVALID_ADDRESS_KEYS.has(result.messageKey)) {
      // Junk addresses (old seed or spam accounts) cannot be mailed at all.
      skipped += 1;
      console.warn(`Skipped user ${user.id}: ${result.error}`);
    } else {
      failed += 1;
      console.error(`Failed for user ${user.id}: ${result.error}`);
      // A first mail that fails is a setup problem (template missing,
      // endpoint wrong), not a bad address: stop rather than fail for everyone.
      if (queued === 0) break;
    }
  }
  console.log(
    `Queued ${queued}, skipped ${skipped} invalid addresses, failed ${failed}.` +
      (failed ? ' Re-run to retry the failed ones.' : '')
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
