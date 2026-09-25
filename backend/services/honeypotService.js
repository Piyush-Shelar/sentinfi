import crypto from 'crypto';
import Document from '../models/Document.js';
import { computeSHA256, encryptDocument } from './cryptoService.js';

function buildDecoyBuffer() {
  const lines = [
    'SENTINFI WEALTH MANAGEMENT PLATFORM',
    'CONFIDENTIAL EQUITY PORTFOLIO AUDIT — FISCAL YEAR 2025',
    '================================================================',
    '',
    'Client Reference:      HNW-2025-INV-00847',
    'Portfolio ID:          EQPF-IN-9921-ALPHA',
    'Audit Period:          April 01, 2024 — March 31, 2025',
    'Generated:             ' + new Date().toISOString(),
    'Classification:        STRICTLY CONFIDENTIAL',
    '',
    '----------------------------------------------------------------',
    'SECTION 1: EQUITY HOLDINGS SUMMARY',
    '----------------------------------------------------------------',
    '',
    'Symbol       Quantity     Avg. Cost     Current Nav    Unrealised PnL',
    'RELIANCE      1,200        2,340.50      2,891.00       +6,60,600.00',
    'HDFCBANK      3,400        1,565.25      1,742.80       +6,03,490.00',
    'INFY           800        1,830.00      1,920.50        +72,400.00',
    'TCS            420        3,450.75      3,780.00       +1,38,255.00',
    'BAJFINANCE     600        6,210.00      7,120.00       +5,46,000.00',
    'WIPRO        2,100          440.00        512.35       +1,51,935.00',
    '',
    'Total Portfolio NAV:            INR 4,87,32,145.00',
    'Total Unrealised Gains:         INR   21,72,680.00',
    'XIRR (FY2025):                  18.43%',
    '',
    '----------------------------------------------------------------',
    'SECTION 2: DEBT & FIXED INCOME',
    '----------------------------------------------------------------',
    '',
    'Instrument                  Face Value     Coupon    Maturity',
    'SBI BONDS 2027              25,00,000      7.35%     Mar 2027',
    'HDFC NCD SERIES IX          10,00,000      8.10%     Jan 2026',
    'Govt of India SDL 2028      50,00,000      6.98%     Jun 2028',
    '',
    '----------------------------------------------------------------',
    'SECTION 3: RISK & COMPLIANCE',
    '----------------------------------------------------------------',
    '',
    'Risk Category:         Moderate-Aggressive',
    'Compliance Flag:       CLEARED',
    'KYC Status:            VERIFIED (CKYC-882341)',
    'AML Check:             PASSED',
    'Nominee on record:     Sunita Mehta (Spouse)',
    '',
    '================================================================',
    'This document is generated and encrypted by SentinFi Vault Engine.',
    'Unauthorised access or duplication is a criminal offence.',
    'Audit Hash will be verified upon each access event.',
    '================================================================',
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

export async function seedClientHoneypot(clientId, vaultPublicKeyPem) {
  const decoyBuffer = buildDecoyBuffer();
  const sha256Hash = computeSHA256(decoyBuffer);
  const { encryptedBlob, iv, authTag, encryptedAESKey } = encryptDocument(
    decoyBuffer,
    vaultPublicKeyPem
  );

  await Document.create({
    clientId,
    documentType: 'PORTFOLIO',
    originalFilename: 'CONFIDENTIAL_EQUITY_PORTFOLIO_AUDIT_2025.pdf',
    mimeType: 'application/pdf',
    fileSize: decoyBuffer.length,
    encryptedBlob,
    iv,
    authTag,
    encryptedAESKey,
    sha256Hash,
    isHoneypot: true,
  });
}
