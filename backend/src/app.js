const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

const path = require('path');

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

module.exports = app;
