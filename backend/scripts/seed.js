import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Document from '../models/Document.js';
import { seedClientHoneypot } from '../services/honeypotService.js';
import { getAdvisorPublicKey } from '../services/keyService.js';

const seedUsers = [
  { name: 'Arjun Mehta',      email: 'arjun.mehta@email.com',       password: 'SentinFi@2026', role: 'client' },
  { name: 'Priya Sharma',     email: 'priya.sharma@email.com',      password: 'SentinFi@2026', role: 'client' },
  { name: 'Rohan Desai',      email: 'rohan.desai@email.com',       password: 'SentinFi@2026', role: 'client' },
  { name: 'Sneha Kulkarni',   email: 'sneha.kulkarni@email.com',    password: 'SentinFi@2026', role: 'client' },
  { name: 'Vikram Nair',      email: 'vikram.nair@email.com',       password: 'SentinFi@2026', role: 'client' },
  { name: 'Rajesh Patel',     email: 'rajesh.patel@sentinfi.io',    password: 'Advisor@2026',  role: 'admin'  },
];

function generateRsaKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
}

export async function seedDummyAccounts() {
  try {
    const vaultPublicKey = getAdvisorPublicKey();

    for (const userData of seedUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const hash = await bcrypt.hash(userData.password, 12);
        let rsaPublicKeyPem = null;
        let rsaPrivateKeyPem = null;
        if (userData.role === 'admin') {
          const kp = generateRsaKeyPair();
          rsaPublicKeyPem = kp.publicKey;
          rsaPrivateKeyPem = kp.privateKey;
        }
        const user = await User.create({ ...userData, password: hash, rsaPublicKeyPem, rsaPrivateKeyPem });

        if (userData.role === 'client') {
          await seedClientHoneypot(user._id, vaultPublicKey);
        }
      } else {
        if (exists.role === 'admin' && !exists.rsaPublicKeyPem) {
          const kp = generateRsaKeyPair();
          exists.rsaPublicKeyPem = kp.publicKey;
          exists.rsaPrivateKeyPem = kp.privateKey;
          await exists.save();
          console.log(`[seed] RSA keys provisioned for existing admin: ${exists.email}`);
        }
        if (exists.role === 'client') {
          const hasDecoy = await Document.findOne({ clientId: exists._id, isHoneypot: true }).select('+isHoneypot').lean();
          if (!hasDecoy) {
            await seedClientHoneypot(exists._id, vaultPublicKey);
            console.log(`[seed] Honeypot document seeded for existing client: ${exists.email}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[seed] Seeding failed:', err.message);
    throw err;
  }
}
