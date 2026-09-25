import crypto from 'crypto';

export function computeSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function encryptDocument(fileBuffer, publicKeyPem) {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encryptedBlob = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedAESKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey
  );

  aesKey.fill(0);

  return { encryptedBlob, iv, authTag, encryptedAESKey };
}

export function decryptDocument(encryptedBlob, iv, authTag, encryptedAESKey, privateKeyPem) {
  let aesKey;
  try {
    aesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.isBuffer(encryptedAESKey) ? encryptedAESKey : Buffer.from(encryptedAESKey)
    );
  } catch (err) {
    const e = new Error('RSA key decapsulation failed: ' + err.message);
    e.code = 'RSA_DECRYPT_FAILED';
    throw e;
  }

  let decryptedBuffer;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.isBuffer(iv) ? iv : Buffer.from(iv)
    );
    decipher.setAuthTag(Buffer.isBuffer(authTag) ? authTag : Buffer.from(authTag));
    decryptedBuffer = Buffer.concat([
      decipher.update(Buffer.isBuffer(encryptedBlob) ? encryptedBlob : Buffer.from(encryptedBlob)),
      decipher.final(),
    ]);
  } catch (err) {
    aesKey.fill(0);
    const e = new Error('AES-GCM authentication tag mismatch. Ciphertext corrupted or altered in storage.');
    e.code = 'CIPHERTEXT_AUTH_FAILED';
    throw e;
  }

  aesKey.fill(0);
  return decryptedBuffer;
}

export function verifyIntegrity(decryptedBuffer, storedHash) {
  const computedHash = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
  const computedBuf = Buffer.from(computedHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  const isValid = computedBuf.length === storedBuf.length &&
    crypto.timingSafeEqual(computedBuf, storedBuf);
  return { isValid, computedHash, storedHash };
}
