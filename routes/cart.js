/**
 * 장바구니 라우트
 * routes/cart.js
 */

const express = require('express');
const router  = express.Router();
const cartController = require('../controllers/cartController');

// POST   /api/cart/add       — 장바구니 추가
router.post('/add', cartController.addToCart);

// GET    /api/cart            — 목록 조회
router.get('/', cartController.getCart);

// PATCH  /api/cart/:cartId    — 수량 변경
router.patch('/:cartId', cartController.updateCartItem);

// DELETE /api/cart/:cartId    — 개별 삭제
router.delete('/:cartId', cartController.deleteCartItem);

// DELETE /api/cart            — 전체 비우기
router.delete('/', cartController.clearCart);

module.exports = router;