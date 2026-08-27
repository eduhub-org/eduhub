import crypto from 'node:crypto';
import { gql, GraphQLClient } from 'graphql-request';
import { escapeHtml } from './emailTemplateVariables.js';

/**
 * Shared helpers for account-less ("guest") event registration.
 *
 * A guest is an ordinary `User` row with `status = 'GUEST'` and no Keycloak
 * account. That choice is what keeps this feature small: enrollment, every
 * transactional mail, session reminders and newsletter opt-in all key off
 * `User.id` and therefore work unchanged. What a guest lacks is a login, so
 * everything they need to do afterwards -- confirm, cancel, erase -- is
 * authenticated by a token emailed to them instead.
 *
 * Two token kinds, deliberately different:
 *
 *   confirmation  Random, stored hashed in `GuestRegistrationToken`, single use,
 *                 7 days. It carries pending state (which course, whether the
 *                 marketing box was ticked), so it has to be a row.
 *
 *   manage        Stateless HMAC over the user id. Carries no state, so there is
 *                 nothing to store -- which means any mailer can regenerate the
 *                 link without the platform ever holding a replayable
 *                 credential. The trade-off is that an individual manage link
 *                 cannot be revoked; it stops working when the guest record is
 *                 anonymized, which is the only revocation this needs.
 */

export const CONFIRM_TOKEN_TTL_DAYS = 7;

const DEFAULT_FRONTEND_URL = 'https://edu.opencampus.sh';

/** Registration types a guest may use. Approval workflows and paid courses are
 *  deliberately excluded: the former needs an admin decision the guest cannot
 *  see, the latter drags in Stripe, invoices and statutory retention periods
 *  that conflict with the guest deletion schedule. */
export const GUEST_ALLOWED_REGISTRATION_TYPES = new Set([
  'DIRECT_CONFIRMATION',
  'DIRECT_WITH_INPUT',
]);

export function getFrontendUrl() {
  return (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
}

export function createHasuraClient() {
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error('HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured');
  }
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });
}

/* ------------------------------------------------ confirmation tokens */

/** Raw token handed to the guest in a link. 32 bytes of CSPRNG output, url-safe. */
export function generateRawToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/** Only the hash is persisted, so a database read yields no working links. */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken), 'utf8').digest('hex');
}

const INSERT_CONFIRM_TOKEN = gql`
  mutation InsertGuestRegistrationToken(
    $tokenHash: String!
    $userId: uuid!
    $courseId: Int!
    $expiresAt: timestamptz!
    $newsletterOptIn: Boolean!
  ) {
    insert_GuestRegistrationToken_one(
      object: {
        tokenHash: $tokenHash
        userId: $userId
        courseId: $courseId
        expiresAt: $expiresAt
        newsletterOptIn: $newsletterOptIn
      }
    ) {
      id
    }
  }
`;

const FIND_CONFIRM_TOKEN = gql`
  query FindGuestRegistrationToken($tokenHash: String!) {
    GuestRegistrationToken(where: { tokenHash: { _eq: $tokenHash } }, limit: 1) {
      id
      userId
      courseId
      newsletterOptIn
      expiresAt
      usedAt
      User {
        id
        firstName
        lastName
        email
        status
      }
    }
  }
`;

const MARK_CONFIRM_TOKEN_USED = gql`
  mutation MarkGuestRegistrationTokenUsed($id: uuid!, $usedAt: timestamptz!) {
    update_GuestRegistrationToken_by_pk(pk_columns: { id: $id }, _set: { usedAt: $usedAt }) {
      id
    }
  }
`;

export async function issueConfirmToken(client, userId, courseId, newsletterOptIn = false) {
  const rawToken = generateRawToken();
  const expiresAt = new Date(
    Date.now() + CONFIRM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  await client.request(INSERT_CONFIRM_TOKEN, {
    tokenHash: hashToken(rawToken),
    userId,
    courseId,
    expiresAt,
    newsletterOptIn: Boolean(newsletterOptIn),
  });
  return rawToken;
}

/**
 * Resolves a raw confirmation token, rejecting anything expired or already
 * spent. Returns `{ ok: false, messageKey }` rather than throwing so callers can
 * answer uniformly for every bad-token case.
 */
export async function resolveConfirmToken(client, rawToken) {
  if (typeof rawToken !== 'string' || rawToken.trim() === '') {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }

  const data = await client.request(FIND_CONFIRM_TOKEN, { tokenHash: hashToken(rawToken) });
  const token = data?.GuestRegistrationToken?.[0];

  if (!token) {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }
  if (new Date(token.expiresAt) <= new Date()) {
    return { ok: false, messageKey: 'TOKEN_EXPIRED' };
  }
  if (token.usedAt) {
    return { ok: false, messageKey: 'TOKEN_ALREADY_USED' };
  }
  // An erased guest keeps no usable token.
  if (token.User?.status === 'DELETED') {
    return { ok: false, messageKey: 'INVALID_TOKEN' };
  }

  return { ok: true, token };
}

export async function markConfirmTokenUsed(client, tokenId) {
  await client.request(MARK_CONFIRM_TOKEN_USED, {
    id: tokenId,
    usedAt: new Date().toISOString(),
  });
}

/* -------------------------------------------------------- manage tokens */

function getManageTokenSecret() {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret || secret.trim() === '') {
    // Failing loudly beats deriving links from a default secret: a predictable
    // secret would let anyone mint a manage link for any guest.
    throw new Error('GUEST_TOKEN_SECRET is not configured');
  }
  return secret;
}

function signUserId(userId) {
  return crypto
    .createHmac('sha256', getManageTokenSecret())
    .update(`MANAGE:${userId}`, 'utf8')
    .digest('base64url');
}

/** Deterministic, so every mailer can regenerate the same link for a guest. */
export function buildManageToken(userId) {
  return `${userId}.${signUserId(userId)}`;
}

/**
 * Verifies a manage token and returns the user id it names, or null. The
 * signature is compared in constant time; a mismatched length is treated as a
 * plain mismatch rather than allowed to short-circuit.
 */
export function verifyManageToken(token) {
  if (typeof token !== 'string') return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const userId = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);

  let expectedSignature;
  try {
    expectedSignature = signUserId(userId);
  } catch {
    return null;
  }

  const provided = crypto.createHash('sha256').update(providedSignature, 'utf8').digest();
  const expected = crypto.createHash('sha256').update(expectedSignature, 'utf8').digest();

  return crypto.timingSafeEqual(provided, expected) ? userId : null;
}

/* -------------------------------------------------------------------- links */

export function buildConfirmLink(rawToken) {
  return `${getFrontendUrl()}/guest/confirm?token=${encodeURIComponent(rawToken)}`;
}

export function buildManageLink(userId) {
  return `${getFrontendUrl()}/guest/manage?token=${encodeURIComponent(buildManageToken(userId))}`;
}

export function buildCourseLink(courseId) {
  return `${getFrontendUrl()}/course/${courseId}`;
}

export function buildPrivacyPolicyLink() {
  return `${getFrontendUrl()}/privacy`;
}

/* ------------------------------------------------------------------- emails */

const GET_TEMPLATE = gql`
  query GetGuestMailTemplate($type: MailTemplateType_enum!) {
    MailTemplate(
      where: { _and: [{ type: { _eq: $type } }, { courseId: { _is_null: true } }] }
      limit: 1
    ) {
      subject
      content
      from
      cc
      bcc
    }
  }
`;

const INSERT_MAIL_LOG = gql`
  mutation InsertGuestMailLog(
    $subject: String!
    $content: String!
    $from: String!
    $to: String!
    $cc: String
    $bcc: String
    $status: String!
    $metadata: jsonb
  ) {
    insert_MailLog_one(
      object: {
        subject: $subject
        content: $content
        from: $from
        to: $to
        cc: $cc
        bcc: $bcc
        status: $status
        metadata: $metadata
      }
    ) {
      id
    }
  }
`;

/**
 * Substitutes `[Guest:*]` and `[User:*]` placeholders. Values are HTML-escaped
 * in the body but not in the subject, mirroring `createVariableReplacer`.
 */
function replaceGuestVariables(text, values, { html = true } = {}) {
  if (!text) return '';
  const escape = html ? escapeHtml : (v) => (v == null ? '' : String(v));
  return Object.entries(values).reduce(
    (acc, [placeholder, value]) => acc.replaceAll(placeholder, escape(value)),
    text
  );
}

/**
 * Renders a guest template and queues it. `metadata` follows the same jsonb
 * convention the cron mailers use, so guest mail is greppable in MailLog
 * alongside everything else.
 */
export async function queueGuestMail(client, logger, { templateType, to, values, metadata }) {
  const templateData = await client.request(GET_TEMPLATE, { type: templateType });
  const template = templateData?.MailTemplate?.[0];

  if (!template) {
    logger.error(`Guest email template not found: ${templateType}`);
    return { success: false, messageKey: 'TEMPLATE_NOT_FOUND' };
  }

  const result = await client.request(INSERT_MAIL_LOG, {
    subject: replaceGuestVariables(template.subject, values, { html: false }),
    content: replaceGuestVariables(template.content, values),
    from: template.from || 'noreply@opencampus.sh',
    to,
    cc: template.cc,
    bcc: template.bcc,
    status: 'READY_TO_SEND',
    metadata: metadata ?? null,
  });

  logger.info(`Queued guest email ${templateType}, mailId: ${result.insert_MailLog_one.id}`);
  return { success: true, mailId: result.insert_MailLog_one.id };
}

/**
 * Footer appended to the standard lifecycle mails when the recipient is a guest.
 * Regular users manage their registrations from their account; a guest has no
 * account, so this link is their only route to their own data. Bilingual to
 * match the templates it is appended to.
 */
export function buildGuestMailFooter(userId) {
  const manageLink = buildManageLink(userId);
  return `
<hr style="margin: 2em 0; border: none; border-top: 1px solid #ccc;" />
<p style="font-size: 0.9em; color: #666;">
  Du bist als Gast angemeldet. Über diesen Link kannst du deine Anmeldung ansehen,
  stornieren oder deine Daten löschen lassen:
  <a href="${manageLink}">Anmeldung verwalten</a>
</p>
<p style="font-size: 0.9em; color: #666;">
  You are registered as a guest. Use this link to view or cancel your registration,
  or to have your data deleted:
  <a href="${manageLink}">Manage registration</a>
</p>`;
}

/**
 * Appends the guest footer to a rendered mail body, or returns it untouched.
 *
 * Every mail a guest receives has to carry their manage link -- it stands in for
 * the account page they do not have, and it is the only route they have to their
 * own data. Centralised here because three senders need it
 * (`sendEnrollmentEmail`, `sendCourseUpdateEmail`, `sendSessionReminders`) and
 * the templates they share also serve logged-in users, for whom the link is
 * meaningless.
 *
 * A missing footer is never worth dropping the mail over: only a misconfigured
 * GUEST_TOKEN_SECRET can fail here, and a session reminder that arrives without
 * the link beats one that never arrives.
 */
export function isGuestRecipient(user) {
  return user?.status === 'GUEST' && !!user?.id;
}

/**
 * A guest mail carries a signed manage link, which is a credential: whoever
 * holds it can read, cancel and erase that person's data. A MailTemplate may
 * carry cc/bcc (an organizer address, say), and those copies would receive the
 * link along with the body. Templates are shared with non-guest mail, so the
 * copies are dropped per recipient rather than removed from the template.
 */
export function guestSafeCopyRecipients(user, { cc, bcc }) {
  return isGuestRecipient(user) ? { cc: null, bcc: null } : { cc, bcc };
}

export function appendGuestMailFooter(content, user, logger) {
  if (!isGuestRecipient(user)) return content;
  try {
    return insertBeforeBodyEnd(content ?? '', buildGuestMailFooter(user.id));
  } catch (error) {
    logger?.error?.(
      `Could not build guest mail footer for user ${user.id}: ${error.message}. ` +
        'Until GUEST_TOKEN_SECRET is set, guests cannot self-serve and erasure ' +
        'requests have to be handled by hand.'
    );
    return content;
  }
}

/**
 * Places the footer inside the document rather than after it. Plain concatenation
 * left the markup dangling past `</html>`; clients render it anyway, but invalid
 * structure is one of the cheap signals spam filters score against.
 */
function insertBeforeBodyEnd(content, footer) {
  const closing = /<\/body\s*>|<\/html\s*>/i.exec(content);
  if (!closing) return content + footer;
  return content.slice(0, closing.index) + footer + content.slice(closing.index);
}

/* ---------------------------------------------------------------- settings */

const GET_APP_SETTINGS = gql`
  query GetGuestAppSettings {
    AppSettings(limit: 1) {
      guestDataRetentionMonths
    }
  }
`;

export async function getGuestRetentionMonths(client) {
  const data = await client.request(GET_APP_SETTINGS);
  return data?.AppSettings?.[0]?.guestDataRetentionMonths ?? 12;
}

/* ---------------------------------------------------------------- throttling */

/**
 * Hourly ceilings on guest registration. Every `MailLog` insert becomes a real
 * Mailgun send and this endpoint needs no credential, so without these a script
 * could mint unbounded guest rows and aim unbounded mail at addresses of its
 * choosing. The cost is money and, worse, sender-domain reputation: bounces from
 * unverified addresses are what get a domain throttled.
 *
 * Hasura CE cannot enforce per-role rate limits (`api_limits` is a Cloud/EE
 * feature and the file is empty), so the handler is the only layer that can hold.
 *
 * The narrow cap is per address *and course*, not per address alone. Repeating
 * one event is what floods an inbox; signing up for several different events in
 * one sitting is what someone does at an open day, and a flat per-address cap
 * cannot tell those apart -- it silently drops the fourth event. `perAddress` is
 * still there as a backstop, just far enough up to clear real use.
 *
 * `perAddressMail` counts delivered mail rather than issued tokens, because not
 * every branch issues one: telling an address that it already has an account
 * sends a mail and creates no token, so every token-based counter reads zero for
 * exactly the addresses an attacker already knows are registered.
 */
export const GUEST_THROTTLE = {
  perAddressMail: 5,
  perAddressCourse: 3,
  perAddress: 10,
  perCourse: 30,
  global: 100,
};

/**
 * Matches no row. Hasura treats `{_eq: null}` as "no condition", so counting by
 * a null user id would silently return the unfiltered total; a sentinel that
 * cannot occur (gen_random_uuid never produces the nil UUID) keeps the count
 * honestly zero for an address we have never seen.
 */
export const NO_SUCH_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Which ceiling a submission trips, or `null` if none does.
 *
 * The distinction the caller needs is not which counter, but whether saying so
 * would describe the *address*:
 *
 *   ADDRESS  keyed on the submitted email. Answering differently would tell an
 *            unauthenticated caller how often that address has signed up
 *            recently, which is the account-enumeration leak the uniform
 *            response exists to prevent. Must be answered as an ordinary
 *            success.
 *   PUBLIC   keyed on the event or the platform. Says nothing about the address,
 *            so it can be reported plainly and the person can be told to try
 *            again later instead of watching an inbox that stays empty.
 */
export function classifyGuestThrottle({
  perAddressMail = 0,
  perAddressCourse = 0,
  perAddress = 0,
  perCourse = 0,
  global = 0,
} = {}) {
  if (
    perAddressMail >= GUEST_THROTTLE.perAddressMail ||
    perAddressCourse >= GUEST_THROTTLE.perAddressCourse ||
    perAddress >= GUEST_THROTTLE.perAddress
  ) {
    return 'ADDRESS';
  }
  if (perCourse >= GUEST_THROTTLE.perCourse || global >= GUEST_THROTTLE.global) {
    return 'PUBLIC';
  }
  return null;
}

/** A person never fills the honeypot field; anything in it is automated. */
export function isHoneypotTripped(value) {
  return String(value ?? '').trim() !== '';
}

/* -------------------------------------------------------------- validation */

/**
 * Intentionally permissive: this is a sanity check, not an attempt to decide
 * whether an address is deliverable. Double opt-in is what actually establishes
 * that the address exists and belongs to the person using the form.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && email.length <= 254;
}

/**
 * Escapes the LIKE metacharacters so an `_ilike` comparison is an exact,
 * case-insensitive match. Without this, `first_last@example.com` would also
 * match `firstXlast@example.com` and could resolve to the wrong account.
 */
export function escapeLikePattern(value) {
  return String(value ?? '').replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidName(name) {
  return name.length >= 1 && name.length <= 100;
}

/* ------------------------------------------------------------- user lookup */

const FIND_USERS_BY_EMAIL = gql`
  query FindGuestUsersByEmail($email: String!) {
    User(where: { email: { _ilike: $email } }, order_by: { created_at: asc }, limit: 10) {
      id
      status
      firstName
      lastName
    }
  }
`;

/**
 * Resolves an address to the rows that may exist for it.
 *
 * Since `User_email_non_guest_key` was narrowed to non-guest rows, "the user
 * with this email" stopped being a single row: an address can carry a guest
 * record *and* the account that later claimed it. A `limit: 1` lookup picks
 * between them arbitrarily, which is how a guest record ends up shadowing a
 * real account and the "you already have an account" guard gets skipped.
 *
 * So return them separately and let callers decide, rather than inherit
 * whatever order Postgres happened to produce:
 *
 *   account  the real account, if any. INACTIVE and SPAM count -- they are
 *            accounts. Note this cannot be done with `order_by: {status: asc}`:
 *            both sort *after* GUEST alphabetically, so ordering would have
 *            reintroduced the same bug for suspended accounts.
 *   guest    the guest record, oldest first, so repeat submissions from one
 *            address keep landing on the same row.
 *
 * A DELETED row is neither. `anonymizeUser` and the guest erasure path both
 * replace the address with `anon_*@example.com`, so one can only appear here if
 * somebody types that placeholder, and reusing it would hand out a token that
 * `resolveConfirmToken` refuses anyway.
 */
export async function findUsersByEmail(client, email) {
  const data = await client.request(FIND_USERS_BY_EMAIL, { email: escapeLikePattern(email) });
  const rows = data?.User ?? [];
  return {
    account: rows.find((row) => row.status !== 'GUEST' && row.status !== 'DELETED') ?? null,
    guest: rows.find((row) => row.status === 'GUEST') ?? null,
  };
}
