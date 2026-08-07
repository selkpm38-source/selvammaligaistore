/**
 * SELVAM MALIGAI STORE — API entrypoint
 */
'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./src/config/env');
const db = require('./src/config/db');
const logger = require('./src/utils/logger');

const {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  hppMiddleware,
  xssMiddleware,
  sanitizeMiddleware,
  blockSqlInjectionPatterns,
} = require('./src/middlewares/security');

const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');

const { initializeDatabase } = require('./src/database/initMongo');

const app = express();

app.set('trust proxy', 1);

// ---------------- Security ----------------
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression());

app.use(express.json({ limit: `${env.upload.maxSizeMb}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.upload.maxSizeMb}mb` }));

app.use(cookieParser(env.cookie.secret));

app.use(hppMiddleware);
app.use(xssMiddleware);
app.use(sanitizeMiddleware);
app.use(blockSqlInjectionPatterns);
app.use(generalLimiter);

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  })
);

// ---------------- Static ----------------
app.use(
  '/uploads',
  express.static('uploads', {
    dotfiles: 'deny',
    index: false,
  })
);

// ---------------- Database ----------------
const dbInitPromise = initializeDatabase().catch((err) => {
  console.error('DATABASE INITIALIZATION FAILED');
  console.error(err);

  logger.error('Database initialization failed', err);

  throw err;
});

// Without this, an unreachable/misconfigured database crashes the entire
// serverless process on cold start (unhandled promise rejection) instead of
// returning a normal 500 response to the request that triggered it.
dbInitPromise.catch(() => {});

app.use(async (req, res, next) => {
  try {
    await dbInitPromise;
    next();
  } catch (err) {
    next(err);
  }
});

// ---------------- Health ----------------
app.get('/api/health', async (req, res) => {
  try {
    await db.healthCheck();

    res.json({
      success: true,
      status: 'ok',
      db: 'connected',
      message: 'Backend is working',
    });
  } catch (err) {
    console.error('==============================');
    console.error('HEALTH CHECK FAILED');
    console.error(err);
    console.error('==============================');

    res.status(500).json({
      success: false,
      status: 'error',
      message: err.message,
      stack:
        process.env.NODE_ENV === 'production'
          ? undefined
          : err.stack,
    });
  }
});

// ---------------- Routes ----------------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// ---------------- Frontend (single-service deployment) ----------------
// Serves the built React app from this same Express server, so frontend and
// backend share one Render web service / one domain — no CORS, no separate
// static site to configure. The frontend must be built first (npm run build
// inside frontend/, producing frontend/dist) — Render's build command does
// this automatically, see render.yaml / RENDER_DEPLOYMENT.md.
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // SPA fallback: any non-API GET request that isn't a real static file
  // gets index.html, so React Router can handle client-side routes like
  // /login, /register, /manager directly (not just via in-app navigation).
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ---------------- Error Handling ----------------
app.use(notFound);
app.use(errorHandler);

// ---------------- Local Server ----------------
async function startServer() {
  // Start listening immediately rather than waiting on the DB. If the DB is
  // unreachable, requests that need it will get a normal 500 (via the
  // dbInitPromise gate + error handler above) instead of nodemon crashing
  // the whole process and refusing to restart.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on port ${env.port}`);
  });

  try {
    await dbInitPromise;
  } catch (err) {
    console.error('Server started, but database connection failed.');
    console.error('Check MONGODB_URI in your .env file — API routes that need the database will return 500 until this is fixed.');
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;