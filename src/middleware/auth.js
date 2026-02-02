const authService = require('../services/authService');
const auditService = require('../services/auditService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

/**
 * Extract user from request (JWT verification)
 */
const extractUserFromRequest = async (req) => {
  // Try to get token from Authorization header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return await authService.findById(decoded.id);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

/**
 * Authentication middleware
 * Verifies user is authenticated and sets req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const user = await extractUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Authorization middleware - Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await extractUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'admin') {
      // Log unauthorized access attempt
      await auditService.log('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', {
        userId: user.id,
        resourceType: 'admin',
        ipAddress: req.ip,
      });

      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(403).json({ error: 'Forbidden' });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if authenticated, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const user = await extractUserFromRequest(req);
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Silently fail, continue without user
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  optionalAuth,
};
