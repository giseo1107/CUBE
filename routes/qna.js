const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/qnaController');

// 1:1 문의
router.post('/inquiries', controller.createInquiry);
router.get ('/inquiries', controller.getMyInquiries);  // 로그인 필요

// 후기
router.get('/reviews', controller.getReviews);

module.exports = router;