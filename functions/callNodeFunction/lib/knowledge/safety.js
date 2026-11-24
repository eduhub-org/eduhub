/**
 * What may enter the Assistant's knowledge index (issue #2195). Files are taken from an allowlist
 * of paths, then a denylist removes anything that could hold secrets or personal data (env files,
 * keys, seeds, migrations, tests and fixtures), and every passage is scanned for secrets before it
 * is embedded. Nothing is read from the database.
 */

/** Repository files by source type; paths are relative to the repo root with forward slashes. */
export const SOURCE_RULES = [
  { sourceType: 'GLOSSARY', pattern: /^CONTEXT\.md$/ },
  { sourceType: 'LOCALE', pattern: /^frontend-nx\/apps\/(edu-hub|stujo)\/locales\/(de|en)\.json$/ },
  { sourceType: 'MANUAL', pattern: /^docs\/manual\/(de|en)\/.+\.md$/ },
  {
    sourceType: 'CODE',
    pattern:
      /^frontend-nx\/apps\/(edu-hub|stujo)\/(components|pages|lib|hooks|helpers|utils|config|contexts|types)\/.+\.(ts|tsx|js|jsx)$/,
  },
  { sourceType: 'CODE', pattern: /^functions\/.+\.(js|ts|py)$/ },
  // Hasura permissions and actions, so the Assistant can tell why something is not allowed.
  { sourceType: 'CODE', pattern: /^backend\/metadata\/(actions\.graphql|actions\.yaml|databases\/default\/(tables|functions)\/[^/]+\.yaml)$/ },
];

/** Never indexed, whatever the allowlist says. */
export const DENIED_PATHS = [
  /(^|\/)\.env($|[./])/i,
  /(^|\/)\.(git|next|venv|cache)\//,
  /(^|\/)(node_modules|dist|build|coverage|venv|__pycache__)\//,
  /(^|\/)(__tests__|tests?|testing|jest|fixtures?|mocks?|__mocks__|scripts)\//,
  /\.(test|spec)\.[a-z]+$/,
  /(^|\/)(conftest|jest\.config|jest\.setup)\.[a-z]+$/,
  /(^|\/)__generated__\//,
  /\.d\.ts$/,
  /(^|\/)(migrations|seeds?)\//,
  /secret|credential|password|private[-_]?key/i,
  /\.(pem|key|p12|pfx|crt|cer|jks|keystore|tfvars|tfstate|sqlite|db|sql|csv|xlsx?)$/i,
  /(^|\/)(package-lock\.json|yarn\.lock)$/,
];

export const sourceTypeOf = (path) => {
  if (DENIED_PATHS.some((pattern) => pattern.test(path))) return null;
  return SOURCE_RULES.find((rule) => rule.pattern.test(path))?.sourceType ?? null;
};

/** Patterns of credentials; a passage with any of them is never indexed. */
export const SECRET_PATTERNS = [
  { name: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Stripe key', pattern: /\b[sr]k_(live|test)_[0-9A-Za-z]{16,}/ },
  { name: 'Stripe webhook secret', pattern: /\bwhsec_[0-9A-Za-z]{16,}/ },
  { name: 'Slack token', pattern: /\bxox[abprs]-[0-9A-Za-z-]{10,}/ },
  { name: 'GitHub token', pattern: /\b(gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,})/ },
  { name: 'JSON web token', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'URL with password', pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"]+:[^\s@/'"$]{3,}@/i },
  {
    name: 'hard-coded credential',
    pattern:
      /\b[\w-]*(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)['"]?\s*[:=]\s*['"][^'"\s${}<>]{8,}['"]/i,
  },
];

export const findSecrets = (text) =>
  SECRET_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);

// The platform's published role mailboxes (the ones the released code and texts use) and example
// domains. Any other address, also a named mailbox on opencampus.sh, is replaced.
const PUBLIC_EMAILS =
  /^((noreply|edu|edu-support|stujo|admin|info|projekt|rechnungen)@opencampus\.sh|[\w.+-]+@example\.(com|org|net))$/i;

/** E-mail addresses are personal data unless they are a published role mailbox or an example. */
export const redactEmails = (text) =>
  text.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, (address) => (PUBLIC_EMAILS.test(address) ? address : '[email]'));
