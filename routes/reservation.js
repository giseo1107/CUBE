/**
 * 예약 API 라우트
 * routes/reservation.js
 * 
 * 사용: server.js에서 app.use('/api/reservation', require('./routes/reservation'));
 */

const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// GET /api/reservation/capacity?date=2026-02-15
// → 해당 날짜의 시간대별 잔여석 조회
router.get('/capacity', reservationController.checkCapacity);

// GET /api/reservation/detail?res_id=123
// → 예약 상세 정보 조회 (완료 페이지에서 사용)
router.get('/detail', reservationController.getReservationDetail);

// POST /api/reservation/create
// → 예약 생성
router.post('/create', reservationController.createReservation);

// POST /api/reservation/send-email
// → 예약 확인 이메일 발송
router.post('/send-email', reservationController.sendEmail);

// GET /api/reservation/my
// → 내 예약 목록 조회 (로그인 시)
router.get('/my', reservationController.getMyReservations);

// PATCH /api/reservation/:resId/cancel
// → 예약 취소
router.patch('/:resId/cancel', reservationController.cancelReservation);

module.exports = router;