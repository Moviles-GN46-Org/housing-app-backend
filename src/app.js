require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// ── HTTP Request Logging (morgan → winston) ──────────────────
// In dev: colored one-liner. In prod: JSON (via 'combined' tokens piped to winston).
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trimEnd()),
    },
  })
);

// ── Core Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Event Listeners (register before routes) ────────────────
require('./events/listeners/notificationListener');
require('./events/listeners/analyticsListener');

// ── Routes ──────────────────────────────────────────────────
app.use('/api', require('./routes/index'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({ success: false, error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'Internal server error';

  if (err.isOperational) {
    // Expected business errors (4xx): log at warn level
    logger.warn(err.message, {
      code,
      statusCode,
      method: req.method,
      path: req.path,
    });
  } else {
    // Unexpected errors (5xx): log full stack at error level
    logger.error('Unhandled error', {
      code,
      method: req.method,
      path: req.path,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: { message, code },
  });
});

module.exports = app;
