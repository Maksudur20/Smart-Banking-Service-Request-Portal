const multer = require('multer');
const path = require('path');

// Memory storage allows direct streaming to Cloudinary buffer without leaving local file artifacts
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Unsupported file extension (${ext}). Permitted: ${ALLOWED_EXTENSIONS.join(', ')}`),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`Unsupported MIME type (${file.mimetype}). Permitted: ${ALLOWED_MIME_TYPES.join(', ')}`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter,
});

module.exports = upload;

