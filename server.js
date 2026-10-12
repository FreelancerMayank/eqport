// Load environment variables before any modules that might depend on them
require('dotenv').config();

const express = require('express');
const path = require('path');
const databaseService = require('./services/database.service');
const dashboardRoutes = require('./routes/dashboard.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Express and View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging (without any credentials)
app.use((req, res, next) => {
  if (!req.path.startsWith('/public') && !req.path.endsWith('.css') && !req.path.endsWith('.js')) {
    const time = new Date().toLocaleTimeString();
    // Keep 1-second poll requests from flooding stdout if desired, or log cleanly
    if (req.path !== '/api/dashboard' && req.path !== '/api/places') {
      console.log(`[${time}] ${req.method} ${req.path}`);
    }
  }
  next();
});

// Routes
app.use('/', dashboardRoutes);
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('dashboard', {
    title: 'EQPORT — 404 Not Found',
    refreshInterval: 1000,
    error: 'The requested page does not exist.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// Server Initialization
async function startServer() {
  console.log('========================================================');
  console.log('   EQPORT — Dynamic Portfolio Dashboard v2.0           ');
  console.log('========================================================');

  // Diagnostic checks on startup
  if (!process.env.MONGO_URL) {
    console.warn('⚠️  [Config Warning] MONGO_URL not defined in .env');
    console.warn('    Dashboard will run in sample/demo mode.');
    console.warn('    To connect to real MongoDB Atlas, set MONGO_URL in your .env file.');
  } else {
    console.log(`ℹ️  [Config] MONGO_URL configured: ${databaseService.maskMongoUri(process.env.MONGO_URL)}`);
    // Attempt database connection
    await databaseService.connect(process.env.MONGO_URL);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 [Server] EQPORT Dashboard running at: http://localhost:${PORT}`);
    console.log(`⏱️  [Server] Default refresh interval: ${process.env.REFRESH_INTERVAL_MS || 1000}ms`);
    console.log('========================================================');
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();

module.exports = app;
