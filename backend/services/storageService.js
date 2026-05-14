const path = require('path');
const fs = require('fs');

/**
 * Storage service — uses Cloudinary when env vars are present, falls back to local disk.
 */

let cloudinaryConfigured = false;
let cloudinary = null;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    const { v2 } = require('cloudinary');
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    cloudinary = v2;
    cloudinaryConfigured = true;
    console.log('[StorageService] Cloudinary configured');
  } catch (e) {
    console.warn('[StorageService] Cloudinary package not available, falling back to local storage');
  }
}

/**
 * Upload a file buffer or local file path.
 * @param {Object} options
 * @param {Buffer} [options.buffer] - File buffer
 * @param {string} [options.filePath] - Local file path (used as fallback if no buffer)
 * @param {string} [options.fileName] - Desired filename
 * @param {string} [options.folder] - Cloudinary folder or local subdirectory
 * @returns {Promise<{ url: string, publicId: string|null, storage: 'cloudinary'|'local' }>}
 */
async function uploadFile({ buffer, filePath, fileName, folder = 'autobody-damage-photos' }) {
  if (cloudinaryConfigured && cloudinary) {
    // Upload to Cloudinary from buffer
    const uploadSource = buffer
      ? `data:image/jpeg;base64,${buffer.toString('base64')}`
      : filePath;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        uploadSource,
        { folder, resource_type: 'image', public_id: fileName ? path.parse(fileName).name : undefined },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storage: 'cloudinary'
          });
        }
      );
    });
  }

  // Local storage fallback
  const uploadsDir = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const safeFileName = fileName || `upload-${Date.now()}.jpg`;
  const destPath = path.join(uploadsDir, safeFileName);

  if (buffer) {
    fs.writeFileSync(destPath, buffer);
  } else if (filePath && filePath !== destPath) {
    fs.copyFileSync(filePath, destPath);
  }

  return {
    url: `/uploads/${folder}/${safeFileName}`,
    publicId: null,
    storage: 'local'
  };
}

module.exports = { uploadFile, isCloudinaryConfigured: () => cloudinaryConfigured };
