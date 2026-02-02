const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  // Server config
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database config
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kirkepsteinify_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: process.env.DB_POOL_MAX || 20,
    min: process.env.DB_POOL_MIN || 4,
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT || 30000,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT || 2000,
  },
  
  // Bcrypt config
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
  },
  
  // API config
  api: {
    measurementLimit: parseInt(process.env.MEASUREMENT_LIMIT || '1000'),
  },
};
