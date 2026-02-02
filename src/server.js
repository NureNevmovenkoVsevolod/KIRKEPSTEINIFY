const app = require('./app');
const config = require('./config/config');

// ============================================
// START SERVER
// ============================================

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     KirkEpsteinify Backend Server      ║
╚════════════════════════════════════════╝

Server Status: ✓ Running
Environment: ${NODE_ENV}
Port: ${PORT}
Database: ${config.database.database}

Ready to accept connections! 🚀
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived SIGTERM, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
