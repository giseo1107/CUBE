/**
 * KakaoPay 결제 라우트
 * routes/payment.js
 */

const express = require('express');
const router  = express.Router();
const paymentController = require('../controllers/paymentController');

// POST  /api/payment/ready        — 결제 준비
router.post('/ready', paymentController.ready);

// GET   /api/payment/approve      — 결제 승인 (카카오 리다이렉트)
router.get('/approve', paymentController.approve);

// GET   /api/payment/success-info — 결제 완료 정보 조회 (success.html용)
router.get('/success-info', paymentController.successInfo);

// GET   /api/payment/cancel       — 결제 취소 (카카오 리다이렉트)
router.get('/cancel', paymentController.cancel);

// GET   /api/payment/fail         — 결제 실패 (카카오 리다이렉트)
router.get('/fail', paymentController.fail);

module.exports = router;
