import crypto from 'crypto';

const KEY_LENGTH_BYTES = 32;

function decodeEncryptionKey(secret: string): Buffer {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error('Missing GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY');
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  const base64Key = Buffer.from(trimmed, 'base64');
  if (base64Key.length === KEY_LENGTH_BYTES) {
    return base64Key;
  }

  throw new Error(
    'Invalid GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY format. Use 64-char hex or base64-encoded 32-byte key.'
  );
}

export function encryptGhostNewsletterCredential(plaintext: string, secret: string): string {
  const key = decodeEncryptionKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}
