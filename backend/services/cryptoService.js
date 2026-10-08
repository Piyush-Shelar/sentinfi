import crypto from 'crypto';

export function computeSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function toBuffer(val) {
  if (!val) return Buffer.alloc(0);
  if (Buffer.isBuffer(val)) return val;
  if (val.buffer && Buffer.isBuffer(val.buffer)) return val.buffer;
  if (val._bsontype === 'Binary' && typeof val.read === 'function') return val.read(0, val.length());
  if (typeof val === 'string') {
    if (/^[0-9a-fA-F]+$/.test(val)) return Buffer.from(val, 'hex');
    return Buffer.from(val, 'base64');
  }
  return Buffer.from(val);
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
  const keyBuffer = toBuffer(encryptedAESKey);
  
  if (keyBuffer.length !== 256) {
    const e = new Error(`Invalid RSA ciphertext length: expected 256 bytes, received ${keyBuffer.length} bytes`);
    e.code = 'RSA_DECRYPT_FAILED';
    throw e;
  }

  let aesKey;
  try {
    aesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      keyBuffer
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
      toBuffer(iv)
    );
    decipher.setAuthTag(toBuffer(authTag));
    decryptedBuffer = Buffer.concat([
      decipher.update(toBuffer(encryptedBlob)),
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
