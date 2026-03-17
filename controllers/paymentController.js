/**
 * KakaoPay 결제 컨트롤러
 * controllers/paymentController.js
 *
 * 환경변수:
 *   KAKAO_SECRET_KEY  — 카카오페이 시크릿 키 (SECRET_KEY로 시작하는 값)
 *   BASE_URL          — 서비스 도메인 (예: https://joljak.onrender.com)
 */

const db = require('../config/db');

const KAKAO_READY_URL   = 'https://open-api.kakaopay.com/online/v1/payment/ready';
const KAKAO_APPROVE_URL = 'https://open-api.kakaopay.com/online/v1/payment/approve';
const CID               = 'TC0ONETIME';

function kakaoHeaders() {
    return {
        'Authorization': `SECRET_KEY ${process.env.KAKAO_SECRET_KEY}`,
        'Content-Type': 'application/json',
    };
}

function baseUrl() {
    return process.env.BASE_URL || 'https://joljak.onrender.com';
}

// ──────────────────────────────────────────────────────────────
// POST /api/payment/ready
// Body: { item_name, total_amount, quantity, cart_ids?, selected_options? }
// ──────────────────────────────────────────────────────────────
exports.ready = async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const {
            item_name,
            total_amount,
            quantity         = 1,
            cart_ids         = [],
            selected_options = null,
        } = req.body;

        if (!item_name || !total_amount) {
            return res.status(400).json({ success: false, message: '상품명과 금액은 필수입니다.' });
        }

        const partner_order_id = `order_${userId}_${Date.now()}`;
        const partner_user_id  = String(userId);

        const payload = {
            cid:               CID,
            partner_order_id,
            partner_user_id,
            item_name,
            quantity:          Number(quantity),
            total_amount:      Number(total_amount),
            tax_free_amount:   0,
            approval_url:      `${baseUrl()}/api/payment/approve`,
            cancel_url:        `${baseUrl()}/api/payment/cancel`,
            fail_url:          `${baseUrl()}/api/payment/fail`,
        };

        const kakaoRes = await fetch(KAKAO_READY_URL, {
            method:  'POST',
            headers: kakaoHeaders(),
            body:    JSON.stringify(payload),
        });

        const kakaoData = await kakaoRes.json();

        if (!kakaoRes.ok) {
            console.error('KakaoPay ready error:', kakaoData);
            return res.status(502).json({ success: false, message: '카카오페이 결제 준비에 실패했습니다.', detail: kakaoData });
        }

        // 세션에 결제 정보 임시 저장 (세션 저장 완료 후 응답)
        req.session.pendingPayment = {
            tid:             kakaoData.tid,
            partner_order_id,
            partner_user_id,
            item_name,
            total_amount:    Number(total_amount),
            quantity:        Number(quantity),
            cart_ids,
            selected_options,
        };

        await new Promise((resolve, reject) => {
            req.session.save(err => err ? reject(err) : resolve());
        });

        return res.json({
            success:                    true,
            next_redirect_pc_url:      kakaoData.next_redirect_pc_url,
            next_redirect_mobile_url:  kakaoData.next_redirect_mobile_url,
        });

    } catch (err) {
        console.error('payment ready error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /api/payment/approve?pg_token=...
// 카카오페이 결제 승인 후 리다이렉트
// ──────────────────────────────────────────────────────────────
exports.approve = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const pending = req.session?.pendingPayment;

        console.log('[approve] userId:', userId, '| pending:', !!pending, '| pg_token:', req.query.pg_token);

        if (!userId) {
            console.error('[approve] 실패: userId 없음 (세션 만료?)');
            return res.redirect(`${baseUrl()}/api/payment/fail`);
        }
        if (!pending) {
            console.error('[approve] 실패: pendingPayment 없음 (세션 저장 실패?)');
            return res.redirect(`${baseUrl()}/api/payment/fail`);
        }

        const { pg_token } = req.query;
        if (!pg_token) {
            console.error('[approve] 실패: pg_token 없음');
            return res.redirect(`${baseUrl()}/api/payment/fail`);
        }

        const payload = {
            cid:             CID,
            tid:             pending.tid,
            partner_order_id: pending.partner_order_id,
            partner_user_id:  pending.partner_user_id,
            pg_token,
        };

        const kakaoRes = await fetch(KAKAO_APPROVE_URL, {
            method:  'POST',
            headers: kakaoHeaders(),
            body:    JSON.stringify(payload),
        });

        const kakaoData = await kakaoRes.json();

        if (!kakaoRes.ok) {
            console.error('[approve] 카카오 승인 API 실패:', kakaoData);
            return res.redirect(`${baseUrl()}/api/payment/fail`);
        }

        console.log('[approve] 카카오 승인 성공, DB 저장 시작');

        // DB에 주문 저장
        const [orderResult] = await db.query(
            `INSERT INTO orders
               (user_id, item_name, total_amount, quantity, selected_options,
                tid, partner_order_id, status, paid_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', NOW())`,
            [
                userId,
                pending.item_name,
                pending.total_amount,
                pending.quantity,
                pending.selected_options || null,
                pending.tid,
                pending.partner_order_id,
            ]
        );

        const orderId = orderResult.insertId;

        // 장바구니 결제인 경우 → 결제된 항목 삭제
        if (Array.isArray(pending.cart_ids) && pending.cart_ids.length > 0) {
            const placeholders = pending.cart_ids.map(() => '?').join(',');
            await db.query(
                `DELETE FROM cart WHERE cart_id IN (${placeholders}) AND user_id = ?`,
                [...pending.cart_ids, userId]
            );
        }

        // 결제 상세 정보 저장
        await db.query(
            `INSERT INTO payments
               (order_id, tid, payment_method_type, item_name, total_amount, approved_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                kakaoData.tid,
                kakaoData.payment_method_type || 'CARD',
                pending.item_name,
                pending.total_amount,
                kakaoData.approved_at || new Date(),
            ]
        );

        // 세션 정리
        delete req.session.pendingPayment;

        return res.redirect(`${baseUrl()}/success.html`);

    } catch (err) {
        console.error('[approve] 예외 발생:', err.message, err.stack);
        return res.redirect(`${baseUrl()}/api/payment/fail`);
    }
};

// ──────────────────────────────────────────────────────────────
// GET /api/payment/cancel
// ──────────────────────────────────────────────────────────────
exports.cancel = (req, res) => {
    delete req.session.pendingPayment;
    res.redirect(`${baseUrl()}/cart.html?payment=cancel`);
};

// ──────────────────────────────────────────────────────────────
// GET /api/payment/fail
// ──────────────────────────────────────────────────────────────
exports.fail = (req, res) => {
    delete req.session.pendingPayment;
    res.redirect(`${baseUrl()}/cart.html?payment=fail`);
};
