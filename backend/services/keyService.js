import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYS_DIR = path.resolve(__dirname, '..', 'keys');
const PUB_PATH = path.join(KEYS_DIR, 'advisor_public.pem');
const PRIV_PATH = path.join(KEYS_DIR, 'advisor_private.pem');

let _publicKey = null;
let _privateKey = null;

function generateAndPersist() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  fs.writeFileSync(PUB_PATH, publicKey, { mode: 0o644 });
  fs.writeFileSync(PRIV_PATH, privateKey, { mode: 0o600 });
  return { publicKey, privateKey };
}

export function initKeyService() {
  if (process.env.ADVISOR_RSA_PUBLIC_KEY && process.env.ADVISOR_RSA_PRIVATE_KEY) {
    _publicKey = process.env.ADVISOR_RSA_PUBLIC_KEY.replace(/\\n/g, '\n');
    _privateKey = process.env.ADVISOR_RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('[keys] Loaded RSA key pair from environment variables');
    return;
  }

  if (fs.existsSync(PUB_PATH) && fs.existsSync(PRIV_PATH)) {
    _publicKey = fs.readFileSync(PUB_PATH, 'utf8');
    _privateKey = fs.readFileSync(PRIV_PATH, 'utf8');
    console.log('[keys] Loaded RSA key pair from keys/ directory');
    return;
  }

  const { publicKey, privateKey } = generateAndPersist();
  _publicKey = publicKey;
  _privateKey = privateKey;
  console.log('[keys] Generated new RSA-2048 key pair and persisted to keys/');
}

export function getAdvisorPublicKey() {
  if (!_publicKey) throw new Error('Key service not initialised');
  return _publicKey;
}

export function getAdvisorPrivateKey() {
  if (!_privateKey) throw new Error('Key service not initialised');
  return _privateKey;
}
