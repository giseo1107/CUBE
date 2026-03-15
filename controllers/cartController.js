/**
 * 장바구니 컨트롤러
 * controllers/cartController.js
 */

const db = require('../config/db');

function getUserId(req) {
    return req.session?.userId || null;
}

// ──────────────────────────────────────────────────────────────
// POST /api/cart/add
// 장바구니 상품 추가
// Body: { product_id, product_name, base_price, quantity, total_amount, selected_options }
// ──────────────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const {
            product_id       = null,
            product_name     = '',
            base_price       = 0,
            quantity         = 1,
            total_amount     = 0,
            selected_options = null,
        } = req.body;

        // 필수 검증
        if (!product_name) {
            return res.status(400).json({ success: false, message: '상품명이 필요합니다.' });
        }
        if (Number(total_amount) <= 0) {
            return res.status(400).json({ success: false, message: '금액이 올바르지 않습니다.' });
        }

        // 이미 같은 product_id + selected_options 조합이 있으면 수량만 증가
        if (product_id) {
            const [existing] = await db.query(
                `SELECT cart_id, quantity FROM cart
                 WHERE user_id = ? AND product_id = ?
                   AND COALESCE(selected_options, '') = COALESCE(?, '')
                 LIMIT 1`,
                [userId, product_id, selected_options || '']
            );

            if (existing.length > 0) {
                const newQty = existing[0].quantity + Number(quantity);
                await db.query(
                    `UPDATE cart SET quantity = ?, total_amount = ?
                     WHERE cart_id = ?`,
                    [newQty, total_amount, existing[0].cart_id]
                );
                return res.json({ success: true, message: '장바구니에 추가되었습니다.', cart_id: existing[0].cart_id });
            }
        }

        // 신규 INSERT
        const [result] = await db.query(
            `INSERT INTO cart
               (user_id, product_id, quantity, product_name, base_price, total_amount, selected_options)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, product_id || null, Number(quantity), product_name,
             Number(base_price), Number(total_amount), selected_options || null]
        );

        return res.json({ success: true, message: '장바구니에 담겼습니다.', cart_id: result.insertId });

    } catch (err) {
        console.error('addToCart error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /api/cart
// 내 장바구니 목록 조회
// ──────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const [items] = await db.query(
            `SELECT cart_id, product_id, product_name, base_price,
                    quantity, total_amount, selected_options, created_at
             FROM cart
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.json({ success: true, items });

    } catch (err) {
        console.error('getCart error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/cart/:cartId
// 수량 변경
// Body: { quantity }
// ──────────────────────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const { cartId } = req.params;
        const { quantity } = req.body;
        const newQty = Number(quantity);

        if (!newQty || newQty < 1) {
            return res.status(400).json({ success: false, message: '수량은 1 이상이어야 합니다.' });
        }

        // 본인 소유 확인
        const [rows] = await db.query(
            `SELECT cart_id, total_amount, quantity FROM cart WHERE cart_id = ? AND user_id = ?`,
            [cartId, userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '장바구니 항목을 찾을 수 없습니다.' });
        }

        await db.query(
            `UPDATE cart SET quantity = ? WHERE cart_id = ?`,
            [newQty, cartId]
        );

        return res.json({ success: true, message: '수량이 변경되었습니다.' });

    } catch (err) {
        console.error('updateCartItem error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/cart/:cartId
// 장바구니 항목 삭제
// ──────────────────────────────────────────────────────────────
exports.deleteCartItem = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const { cartId } = req.params;

        const [rows] = await db.query(
            `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ?`,
            [cartId, userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '장바구니 항목을 찾을 수 없습니다.' });
        }

        await db.query(`DELETE FROM cart WHERE cart_id = ?`, [cartId]);

        return res.json({ success: true, message: '상품이 삭제되었습니다.' });

    } catch (err) {
        console.error('deleteCartItem error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/cart
// 장바구니 전체 비우기
// ──────────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        await db.query(`DELETE FROM cart WHERE user_id = ?`, [userId]);

        return res.json({ success: true, message: '장바구니가 비워졌습니다.' });

    } catch (err) {
        console.error('clearCart error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};