const prisma = require('../../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * Upload Media (Image / Video) to Cloudinary and record in database
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file provided for upload', 400);
    }

    const { entityType = 'FOOD', entityId } = req.body;
    const isVideo = req.file.mimetype.startsWith('video');

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `foodpanda/${entityType.toLowerCase()}`,
      resource_type: isVideo ? 'video' : 'image',
    });

    let mediaRecord = null;
    if (entityId) {
      mediaRecord = await prisma.media.create({
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          entityType: entityType.toUpperCase(),
          entityId,
        },
      });
    }

    return successResponse(
      res,
      'Media uploaded successfully',
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        mediaRecord,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Media
 */
const removeMedia = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return errorResponse(res, 'publicId is required', 400);
    }

    await deleteFromCloudinary(publicId);
    await prisma.media.deleteMany({
      where: { publicId },
    });

    return successResponse(res, 'Media deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  removeMedia,
};
