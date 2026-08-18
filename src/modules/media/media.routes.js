const express = require('express');
const router = express.Router();
const mediaController = require('./media.controller');
const upload = require('../../middlewares/upload.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/upload', authenticate, upload.single('file'), mediaController.uploadMedia);
router.delete('/delete', authenticate, mediaController.removeMedia);

module.exports = router;
