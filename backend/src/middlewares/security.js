/**
 * Central security middleware stack.
 * Mounted in server.js in this order: helmet -> cors -> compression ->
 * body parsers -> sanitizers -> rate limiters.
 */
'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize'); // also strips $/. keys from bodies, harmless for SQL apps, blocks NoSQL-style operator injection in JSON payloads
const env = require('../config/env');

// ---- Helmet: secure HTTP headers (clickjacking, MIME sniffing, etc.) ----
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      // 'self' + 'unsafe-inline' for styles injected by the app itself
      // (Tailwind, styled JSX, etc.), plus fonts.googleapis.com because
      // index.html explicitly links a Google Fonts stylesheet — without
      // this the browser blocks that stylesheet entirely and the site
      // falls back to its default font.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      // The stylesheet above then requests the actual font files from
      // fonts.gstatic.com — that needs its own allowance under fontSrc,
      // a separate CSP directive from styleSrc.
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"], // extra clickjacking defense alongside X-Frame-Options
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
});

// ---- CORS: only the configured client origin, credentials allowed ----
// If CLIENT_URL isn't set (e.g. forgotten on first deploy before the host
// assigns a URL), env.clientUrl is null. Passing `origin: null` straight to
// the `cors` package isn't a recognized value — it silently blocks every
// request instead of degrading gracefully. Since frontend + backend are
// served from the same Express app/domain in this project, reflecting the
// request's own origin back is a safe fallback here (same-origin requests
// aren't even subject to CORS enforcement by the browser either way).
const corsMiddleware = cors({
  origin: env.clientUrl || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ---- Rate limiting ----
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter limiter for auth endpoints — mitigates brute force / credential stuffing.
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

/**
 * XSS sanitization: recursively strips dangerous HTML/script content from
 * every string in req.body/query/params using the actively-maintained
 * `xss` library (the older `xss-clean` package is unmaintained and was
 * deliberately avoided here).
 */
function deepSanitize(value) {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) out[key] = deepSanitize(value[key]);
    return out;
  }
  return value;
}

function xssMiddlewareFn(req, res, next) {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.params) req.params = deepSanitize(req.params);
  // req.query is a getter-only property on some Express versions; mutate in place instead of reassigning.
  if (req.query) {
    const sanitizedQuery = deepSanitize(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, sanitizedQuery);
  }
  next();
}

/**
 * SQL injection is primarily prevented at the query layer (parameterized
 * queries in config/db.js). This middleware is a defense-in-depth net that
 * rejects requests containing classic SQL meta-sequences in query/body
 * string values, in case a future route ever forgets to parameterize.
 */
const SQLI_PATTERN = /(\b(select|insert|update|delete|drop|union|exec)\b.*\b(from|into|table|where)\b)|(--)|(;--)|(\/\*)/i;

function blockSqlInjectionPatterns(req, res, next) {
  const values = [
    ...Object.values(req.query || {}),
    ...Object.values(req.body || {}),
    ...Object.values(req.params || {}),
  ];
  for (const v of values) {
    if (typeof v === 'string' && SQLI_PATTERN.test(v)) {
      return res.status(400).json({ success: false, message: 'Invalid input detected.' });
    }
  }
  next();
}

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  authLimiter,
  hppMiddleware: hpp(), // prevents HTTP parameter pollution
  xssMiddleware: xssMiddlewareFn, // strips <script> etc. from req.body/query/params
  sanitizeMiddleware: mongoSanitize(),
  blockSqlInjectionPatterns,
};
