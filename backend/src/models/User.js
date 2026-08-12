'use strict';

const { mongoose } = require('../config/db');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: null },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'owner', 'manager', 'staff'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    referralCode: { type: String, default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);



const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Normalizes a Mongo document to the flat shape the rest of the app expects
// (id + password_hash), so controllers don't need to know about Mongoose.
function normalize(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;

  return {
    id: obj._id.toString(),
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    password_hash: obj.passwordHash,
    role: obj.role,
    status: obj.status,
    failed_login_attempts: obj.failedLoginAttempts,
    locked_until: obj.lockedUntil,
    last_login_at: obj.lastLoginAt,
    referral_code: obj.referralCode,
    referred_by: obj.referredBy ? obj.referredBy.toString() : null,
    created_at: obj.createdAt,
    updated_at: obj.updatedAt,
  };
}

async function findByEmail(email) {
  const doc = await UserModel.findOne({ email: String(email).toLowerCase().trim() });
  return normalize(doc);
}

async function findById(id) {
  const doc = await UserModel.findById(id);
  return normalize(doc);
}

async function create({ name, email, phone, passwordHash, role, referralCode, referredBy }) {
  const doc = await UserModel.create({
    name,
    email: String(email).toLowerCase().trim(),
    phone: phone || null,
    passwordHash,
    role: role || 'customer',
    referralCode: referralCode || null,
    referredBy: referredBy || null,
  });

  return normalize(doc);
}

async function incrementFailedAttempts(id) {
  await UserModel.updateOne({ _id: id }, { $inc: { failedLoginAttempts: 1 } });
}

async function lockAccount(id, until) {
  await UserModel.updateOne({ _id: id }, { lockedUntil: until });
}

async function resetFailedAttempts(id) {
  await UserModel.updateOne(
    { _id: id },
    { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
  );
}

module.exports = {
  UserModel,
  findByEmail,
  findById,
  create,
  incrementFailedAttempts,
  lockAccount,
  resetFailedAttempts,
};
