const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for Authentication (Login / Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for Document Uploads
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 uploads per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached for this session. Please wait a few minutes.',
  },
});

// Rate limiter for AI analysis calls
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 AI reviews per 5 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI validation rate limit exceeded. Please wait a few minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
};

