/**
 * Centralized, validated environment configuration.
 */
'use strict';

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Required secrets must come from environment variables (Render dashboard / local .env).
// They are intentionally NOT hardcoded here — baking real credentials into source code
// means anyone with the code (or the git history) has full access to your database and
// can forge auth tokens. In local development, generate throwaway values in your own
// .env file (see .env.example) rather than relying on defaults.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your .env file (local) ` +
      `or in the Render dashboard's Environment settings (production).`
    );
  }
  return value;
}

const defaultMongoUri = requireEnv('MONGODB_URI');
const defaultJwtAccessSecret = requireEnv('JWT_ACCESS_SECRET');
const defaultJwtRefreshSecret = requireEnv('JWT_REFRESH_SECRET');
const defaultCookieSecret = requireEnv('COOKIE_SECRET');

// Normalizes whatever the person typed for CLIENT_URL into a clean
// "https://host" origin with no trailing slash, adding the protocol if they
// forgot it. Falls back to Render's own auto-populated external URL, then to
// localhost for local dev — never to a hardcoded domain from a different
// project/host.
function resolveClientUrl() {
  const raw = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL;

  if (!raw) {
    return isProduction ? null : 'http://localhost:5173';
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

module.exports = {
  isProduction,

  port: parseInt(process.env.PORT, 10) || 5000,

  clientUrl: resolveClientUrl(),

  ownerEmail: (
    process.env.OWNER_EMAIL || 'owner@selvammaligai.store'
  ).toLowerCase(),

  // MongoDB connection
  mongoUri: defaultMongoUri,

  jwt: {
    accessSecret: defaultJwtAccessSecret,

    refreshSecret: defaultJwtRefreshSecret,

    accessExpiresIn:
      process.env.JWT_ACCESS_EXPIRES_IN || '15m',

    refreshExpiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cookie: {
    secret: defaultCookieSecret,

    secure: process.env.COOKIE_SECURE === 'true' || isProduction,

    // 'lax' works when the frontend is served by this same backend (single
    // Render web service serving both, which is how this project is set up
    // for Render). Only switch to 'none' if you split frontend/backend into
    // two separate services on two different domains — 'none' also requires
    // secure:true, which is already forced on in production above.
    sameSite:
      process.env.COOKIE_SAME_SITE || 'lax',
  },

  rateLimit: {
    windowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) ||
      15 * 60 * 1000,

    max:
      parseInt(process.env.RATE_LIMIT_MAX, 10) ||
      200,

    authMax:
      parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) ||
      100,
  },

  lockout: {
    maxFailedAttempts:
      parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 10) ||
      5,

    durationMinutes:
      parseInt(process.env.LOCKOUT_DURATION_MINUTES, 10) ||
      15,
  },

  upload: {
    dir:
      process.env.UPLOAD_DIR ||
      'uploads/products',

    maxSizeMb:
      parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) ||
      5,
  },
};
