import mongoose from 'mongoose';

const accessGrantSchema = new mongoose.Schema(
  {
    advisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    encryptedAESKey: {
      type: Buffer,
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['PAN', 'AADHAAR', 'ITR', 'SALARY_SLIP', 'PORTFOLIO'],
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    encryptedBlob: {
      type: Buffer,
      required: true,
    },
    iv: {
      type: Buffer,
      required: true,
    },
    authTag: {
      type: Buffer,
      required: true,
    },
    encryptedAESKey: {
      type: Buffer,
      required: true,
    },
    sha256Hash: {
      type: String,
      required: true,
    },
    isHoneypot: {
      type: Boolean,
      default: false,
      select: false,
    },
    accessGrants: {
      type: [accessGrantSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
