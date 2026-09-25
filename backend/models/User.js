import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['client', 'admin'],
      required: true,
    },
    rsaPublicKeyPem: {
      type: String,
      default: null,
    },
    rsaPrivateKeyPem: {
      type: String,
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockReason: {
      type: String,
      default: null,
    },
    passwordMetrics: {
      length:         { type: Number,  default: 0 },
      hasUpperCase:   { type: Boolean, default: false },
      hasLowerCase:   { type: Boolean, default: false },
      hasNumber:      { type: Boolean, default: false },
      hasSpecialChar: { type: Boolean, default: false },
      entropyScore:   { type: Number,  default: 0 },
      updatedAt:      { type: Date,    default: Date.now },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);

export default User;
