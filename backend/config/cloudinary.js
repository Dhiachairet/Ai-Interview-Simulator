const cloudinary = require('cloudinary').v2;

// Cloudinary is OPTIONAL. It is considered configured if either the discrete
// vars (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) or a single CLOUDINARY_URL
// are present. If not configured, uploads are skipped gracefully so the app
// never crashes and resume parsing still works.
const hasDiscrete = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
const hasUrl = !!process.env.CLOUDINARY_URL;
const configured = hasDiscrete || hasUrl;

// When CLOUDINARY_URL is set the SDK auto-configures from it; otherwise use the
// discrete variables.
if (hasDiscrete && !hasUrl) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const isConfigured = () => configured;

/**
 * Upload an in-memory file buffer (PDF/DOCX) to Cloudinary and return the
 * resulting secure URL. Resolves to null if Cloudinary is not configured.
 */
const uploadBufferToCloudinary = (buffer, { folder = 'resumes', filename } = {}) =>
  new Promise((resolve, reject) => {
    if (!configured) {
      return resolve(null);
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result && result.secure_url ? result.secure_url : null);
      }
    );
    stream.end(buffer);
  });

module.exports = { cloudinary, isConfigured, uploadBufferToCloudinary };
