const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_foodpanda_jwt_key_2026_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecret_foodpanda_refresh_jwt_key_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate Access Token
 * @param {Object} payload 
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate Refresh Token and its SHA256 Hash
 * @returns {{token: string, hash: string, expiresAt: Date}}
 */
const generateRefreshToken = () => {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
  return { token, hash, expiresAt };
};

/**
 * Hash a plain refresh token string
 * @param {string} token 
 * @returns {string}
 */
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify Access Token
 * @param {string} token 
 * @returns {Object}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyAccessToken,
};
