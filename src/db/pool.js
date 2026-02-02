const { Pool } = require('pg');
const config = require('../config/config');

// Create database connection pool
const pool = new Pool(config.database);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Log connection events in development
if (config.nodeEnv === 'development') {
  pool.on('connect', () => {
    console.log('New client connected to database');
  });
  
  pool.on('remove', () => {
    console.log('Client removed from pool');
  });
}

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err);
  } else {
    console.log('✓ Database connection successful');
  }
});

// Graceful pool shutdown
process.on('SIGINT', async () => {
  console.log('\nClosing database pool...');
  await pool.end();
});

module.exports = pool;
