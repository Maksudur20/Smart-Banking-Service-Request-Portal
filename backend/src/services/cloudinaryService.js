const { cloudinary, isConfigured } = require('../config/cloudinary');
const { Readable } = require('stream');

const DEFAULT_FOLDER = process.env.CLOUDINARY_FOLDER || 'Smart-Banking-Service-Request-Portal';

/**
 * Uploads a file buffer directly to Cloudinary inside the designated project folder.
 */
async function uploadFileBuffer(buffer, originalname, folder = DEFAULT_FOLDER) {
  if (!isConfigured) {
    // Mock upload fallback for development without credentials
    return {
      public_id: `${folder}/mock_${Date.now()}_${originalname}`,
      secure_url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
      resource_type: 'image',
      format: originalname.split('.').pop(),
      bytes: buffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    // Pass the buffer into uploadStream
    const { Readable } = require('stream');
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Generates an access-controlled or signed URL for preview
 */
function getDocumentAccessUrl(publicId, resourceType = 'image') {
  if (!isConfigured) {
    return 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  }
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
}

/**
 * Deletes an asset from Cloudinary
 */
async function deleteDocument(publicId, resourceType = 'image') {
  if (!isConfigured) return true;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
    return false;
  }
}

module.exports = {
  uploadFileBuffer,
  getDocumentAccessUrl,
  deleteDocument,
};

