const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testConnection() {
  console.log('Testing Cloudinary connection for cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const ping = await cloudinary.api.ping();
    console.log('Cloudinary Ping Result:', ping);
    console.log('Target folder:', process.env.CLOUDINARY_FOLDER || 'Smart-Banking-Service-Request-Portal');
    console.log('Cloudinary authentication successful!');
  } catch (err) {
    console.error('Cloudinary connection failed:', err.message);
  }
}

testConnection();

