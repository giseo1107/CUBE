const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const controller = require('../controllers/reviewController');

// 이미지는 메모리에 버퍼로 받아서 Cloudinary로 전송
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5MB
  fileFilter: (req, file, cb) => {
    const ok = !!file.mimetype.match(/image\/(jpeg|png|webp)/);
    cb(null, ok);
  },
});

router.get ('/',           controller.getReviews);
router.get ('/:id',        controller.getReviewById);
router.post('/',           controller.createReview);
router.post('/upload',     upload.array('images', 3), controller.uploadImages);
router.put   ('/:id',      controller.updateReview);
router.delete('/:id',      controller.deleteReview);

module.exports = router;