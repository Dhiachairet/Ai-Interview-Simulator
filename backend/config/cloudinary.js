// Cloudinary is OPTIONAL. The SDK is loaded LAZILY (only when an upload
// actually happens) and fully guarded, so a missing OR malformed config can
// never crash the server at startup. The official SDK validates CLOUDINARY_URL
// at require() time and throws on a bad value, which is why we never require it
// at module load.

const hasDiscrete = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const urlLooksValid = !!(
  process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')
);

// Warn (never crash) if CLOUDINARY_URL is present but malformed.
if (process.env.CLOUDINARY_URL && !urlLooksValid) {
  console.warn('⚠️  CLOUDINARY_URL is set but malformed (it must start with "cloudinary://"). Ignoring it.');
}

const configured = hasDiscrete || urlLooksValid;

let cloudinaryInstance = null;
let triedLoad = false;

const loadCloudinary = () => {
  if (triedLoad) return cloudinaryInstance;
  triedLoad = true;

  // Keep a malformed CLOUDINARY_URL away from require() so the SDK can't throw.
  if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    delete process.env.CLOUDINARY_URL;
  }

  try {
    const cloudinary = require('cloudinary').v2;
    // When relying on the discrete vars (no URL), configure explicitly.
    if (hasDiscrete && !process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
    cloudinaryInstance = cloudinary;
  } catch (err) {
    console.warn('⚠️  Cloudinary SDK could not be initialised — file uploads disabled:', err.message);
    cloudinaryInstance = null;
  }
  return cloudinaryInstance;
};

const isConfigured = () => configured;

/**
 * Upload an in-memory file buffer (PDF/DOCX) to Cloudinary and return the
 * resulting secure URL. Resolves to null if Cloudinary is not configured or
 * the SDK could not be loaded.
 */
const uploadBufferToCloudinary = (buffer, { folder = 'resumes', filename } = {}) =>
  new Promise((resolve, reject) => {
    if (!configured) return resolve(null);
    const cloudinary = loadCloudinary();
    if (!cloudinary) return resolve(null);
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

module.exports = { isConfigured, uploadBufferToCloudinary, loadCloudinary };
