function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum permitted limit of 10MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Database unique constraint violation (PostgreSQL code 23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record with this information already exists in the system.',
      detail: err.detail,
    });
  }

  // Database foreign key violation (PostgreSQL code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist in the database.',
      detail: err.detail,
    });
  }

  // Custom validation or business error message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

