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
const allowedOrigins = [env.CORS_ORIGIN, 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const path = require('path');

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const fs = require('fs');
const fileService = require('./services/fileService');

// Serve uploads from DB if not found on disk (to support stateless environments)
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath1 = path.join(__dirname, '../uploads', filename);
    const filePath2 = path.join(__dirname, '../public/uploads', filename);
    
    if (fs.existsSync(filePath1)) {
      return res.sendFile(filePath1);
    }
    if (fs.existsSync(filePath2)) {
      return res.sendFile(filePath2);
    }
    
    const file = await fileService.getFile(filename);
    if (file) {
      res.setHeader('Content-Type', file.mime_type);
      return res.send(file.data);
    }
  } catch (err) {
    console.error('Error fetching file from DB:', err.message);
  }
  next();
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Debug endpoint
app.get('/api/debug-db', async (req, res) => {
  try {
    const pool = require('./config/database');
    const fs = require('fs');
    const path = require('path');
    
    const results = {};
    
    // Check schema file existence
    const schemaPath = path.join(__dirname, './database/schema.sql');
    results.schemaFileExists = fs.existsSync(schemaPath);
    results.schemaPathResolved = schemaPath;
    if (results.schemaFileExists) {
      results.schemaFileSize = fs.statSync(schemaPath).size;
    }
    
    // Query tables
    const [tablesResult] = await pool.query('SHOW TABLES');
    if (tablesResult.length > 0) {
      const dbNameKey = Object.keys(tablesResult[0])[0];
      const allTables = tablesResult.map(row => row[dbNameKey]);
      results.tables = {};
      
      for (const table of allTables) {
        const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
        results.tables[table] = cols.map(c => ({
          field: c.Field,
          type: c.Type,
          key: c.Key,
          extra: c.Extra
        }));
      }
    } else {
      results.tables = [];
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// API routes
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

module.exports = app;
