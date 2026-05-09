const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/galleryController');
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'joljak/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/',        controller.getPosts);
router.get('/:id',     controller.getPostDetail);
router.post('/',       upload.single('image'), controller.createPost);
router.post('/:id/like', controller.toggleLike);
router.put('/:id',     upload.single('image'), controller.updatePost);
router.delete('/:id',  controller.deletePost);

module.exports = router;