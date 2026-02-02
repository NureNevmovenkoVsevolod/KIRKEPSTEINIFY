const authService = require('../services/authService');
const auditService = require('../services/auditService');

/**
 * Extract user from request (placeholder - in real app would verify JWT token)
 * For demo purposes, checks X-User-ID header
 */
const extractUserFromRequest = async (req) => {
  // In production, this would verify JWT token
  // For now, we accept userId from header (for testing)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return null;
  }

  return await authService.findById(userId);
};

/**
 * Authentication middleware
 * Verifies user is authenticated and sets req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const user = await extractUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found or invalid token' });
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
