import crypto from 'crypto';

/**
 * Decrypts an organization's integration credential (Ghost newsletter key,
 * Rausgegangen API key). The frontend's credential API routes encrypt them with
 * AES-256-GCM as "v1:iv:authTag:ciphertext" (base64 parts), using the key in
 * GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY - the name predates the second
 * credential, the key is shared.
 */

const KEY_LENGTH_BYTES = 32;
const KEY_ENV = 'GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const decodeEncryptionKey = () => {
  const raw = normalize(process.env[KEY_ENV]);
  if (!raw) {
    throw new Error(`Missing ${KEY_ENV}`);
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const base64Key = Buffer.from(raw, 'base64');
  if (base64Key.length === KEY_LENGTH_BYTES) {
    return base64Key;
  }

  throw new Error(`Invalid ${KEY_ENV} format. Use 64-char hex or base64-encoded 32-byte key.`);
};

/**
 * @param {string} encryptedValue - "v1:iv:authTag:ciphertext"
 * @param {string} [label] - what the credential is, for error messages
 * @returns {string} the plaintext credential
 */
export const decryptOrganizationCredential = (encryptedValue, label = 'Credential') => {
  const payload = normalize(encryptedValue);
  if (!payload) {
    throw new Error(`${label} is missing`);
  }

  const [version, ivBase64, authTagBase64, ciphertextBase64] = payload.split(':');
  if (version !== 'v1' || !ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error(`${label} payload has invalid format`);
  }

  const key = decodeEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  const credential = normalize(plaintext);

  if (!credential) {
    throw new Error(`${label} is empty after decryption`);
  }

  return credential;
};
