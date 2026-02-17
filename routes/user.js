const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// 모든 라우트에 인증 필요
router.use(isAuthenticated);

// 사용자 정보 조회
router.get('/info', userController.getUserInfo);

// 사용자 정보 수정
router.put('/info', userController.updateUserInfo);

// ⭐⭐⭐ 프로필 이미지 라우트들 (순서 중요!) ⭐⭐⭐
router.put('/profile-image', userController.updateProfileImage);
router.delete('/profile-image', userController.deleteProfileImage);

// 비밀번호 변경
router.put('/password', userController.changePassword);

// 회원 탈퇴
router.delete('/account', userController.deleteAccount);

module.exports = router;