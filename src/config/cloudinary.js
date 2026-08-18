const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'foodpanda',
      resource_type: options.resourceType || 'auto',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'vendor-food',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

/**
 * Delete asset from Cloudinary
 * @param {string} publicId 
 * @param {string} resourceType 
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
