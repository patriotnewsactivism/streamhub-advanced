const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable must be set in production');
  process.exit(1);
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      // Don't include PII like email in tokens - just the ID
    },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate JWT refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  try {
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but that's okay for optional auth
    }
  }

  next();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  optionalAuthMiddleware
};
