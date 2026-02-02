const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      dbTime: dbResult.rows[0].now,
    });
  })
);

module.exports = router;
