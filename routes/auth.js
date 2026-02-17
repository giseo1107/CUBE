const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkAuth } = require('../middleware/authMiddleware');

// 회원가입
router.post('/signup', authController.signup);

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 이메일 인증
router.get('/verify-email', authController.verifyEmail);

// 인증 메일 재발송
router.post('/resend-verification', authController.resendVerificationEmail);

// 로그인 상태 확인
router.get('/check', checkAuth);

module.exports = router;