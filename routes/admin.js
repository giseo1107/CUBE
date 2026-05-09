const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/adminController');

// 관리자 인증 미들웨어
function adminAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ success: false, message: '관리자 권한이 필요합니다.' });
}

router.post  ('/login',                controller.login);
router.post  ('/logout',               controller.logout);
router.get   ('/check',                controller.check);

router.get   ('/users',                adminAuth, controller.getUsers);
router.delete('/users/:id',            adminAuth, controller.deleteUser);

router.get   ('/orders',               adminAuth, controller.getOrders);

router.get   ('/reservations',         adminAuth, controller.getReservations);
router.patch ('/reservations/:id',     adminAuth, controller.updateReservation);

router.get   ('/inquiries',            adminAuth, controller.getInquiries);
router.post  ('/inquiries/:id/reply',  adminAuth, controller.replyInquiry);

router.get   ('/gallery',              adminAuth, controller.getGallery);
router.delete('/gallery/:id',          adminAuth, controller.deleteGallery);

module.exports = router;
