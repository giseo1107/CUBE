/**
 * 예약 컨트롤러
 * controllers/reservationController.js
 * 
 * 시간대별 최대 4명 제한, 잔여석 조회, 트랜잭션 기반 예약 생성
 */

const db = require('../config/db');
const { sendReservationEmail } = require('../utils/emailSender');

// ── 상수 ──
const MAX_PEOPLE_PER_SLOT = 4;
const ALLOWED_TIMES = ['10:00:00', '11:30:00', '13:00:00', '14:30:00', '16:00:00'];
const TIME_LABELS = ['10:00', '11:30', '13:00', '14:30', '16:00'];

/**
 * 세션에서 user_id 추출
 * authController.js에서 req.session.userId = user.user_id 로 저장함
 */
function getUserId(req) {
    return req.session?.userId || null;
}

/**
 * GET /api/reservation/capacity?date=2026-02-15
 * 해당 날짜의 시간대별 잔여석 반환
 */
exports.checkCapacity = async (req, res) => {
    try {
        const { date } = req.query;

        // 날짜 형식 검증
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: '유효한 날짜를 입력해주세요. (형식: YYYY-MM-DD)'
            });
        }

        // 날짜 유효성 검증
        const dateObj = new Date(date + 'T00:00:00');
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: '존재하지 않는 날짜입니다.'
            });
        }

        // 해당 날짜의 시간대별 예약 인원 합계 조회
        const [rows] = await db.query(
            `SELECT visit_time, COALESCE(SUM(people_count), 0) AS booked_count
             FROM reservation
             WHERE visit_date = ? AND status IN ('BOOKED', 'pending', 'confirmed')
             GROUP BY visit_time`,
            [date]
        );

        // 결과를 맵으로 변환
        const bookedMap = {};
        rows.forEach(row => {
            // DB time 형식 HH:MM:SS → HH:MM
            const timeKey = String(row.visit_time).substring(0, 5);
            bookedMap[timeKey] = Number(row.booked_count);
        });

        // 모든 시간 슬롯에 대해 잔여석 계산
        const slots = {};
        TIME_LABELS.forEach(time => {
            const booked = bookedMap[time] || 0;
            slots[time] = Math.max(0, MAX_PEOPLE_PER_SLOT - booked);
        });

        return res.json({
            success: true,
            date,
            slots
        });

    } catch (err) {
        console.error('checkCapacity error:', err);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

/**
 * POST /api/reservation/create
 * 예약 생성 (트랜잭션 + 잠금으로 동시성 제어)
 * 
 * Body: {
 *   visit_date: "2026-02-15",
 *   visit_time: "14:30",
 *   people_count: 2,
 *   visitor_name: "홍길동",   (선택)
 *   phone: "010-1234-5678",  (선택)
 *   email: "test@email.com", (선택)
 *   memo: ""                 (선택)
 * }
 */
exports.createReservation = async (req, res) => {
    const conn = await db.getConnection();

    try {
        const {
            visit_date,
            visit_time,
            people_count,
            visitor_name = '',
            phone = '',
            email = '',
            memo = ''
        } = req.body;

        // ── 필수값 검증 ──
        if (!visit_date || !/^\d{4}-\d{2}-\d{2}$/.test(visit_date)) {
            return res.status(400).json({ success: false, message: '유효한 날짜를 입력해주세요.' });
        }
        if (!visit_time || !/^\d{2}:\d{2}$/.test(visit_time)) {
            return res.status(400).json({ success: false, message: '유효한 시간을 입력해주세요.' });
        }

        const count = Number(people_count);
        if (!count || count < 1) {
            return res.status(400).json({ success: false, message: '인원은 1명 이상이어야 합니다.' });
        }
        if (count > MAX_PEOPLE_PER_SLOT) {
            return res.status(400).json({ success: false, message: `최대 인원은 ${MAX_PEOPLE_PER_SLOT}명입니다.` });
        }

        // 날짜 유효성
        const dateObj = new Date(visit_date + 'T00:00:00');
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ success: false, message: '존재하지 않는 날짜입니다.' });
        }

        // 과거 날짜 차단
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj < today) {
            return res.status(400).json({ success: false, message: '과거 날짜에는 예약할 수 없습니다.' });
        }

        // 월요일 휴무 차단 (getDay: 0=일, 1=월)
        if (dateObj.getDay() === 1) {
            return res.status(400).json({ success: false, message: '월요일은 휴무입니다.' });
        }

        // 허용 시간대 검증
        const visitTimeFull = visit_time + ':00';
        if (!ALLOWED_TIMES.includes(visitTimeFull)) {
            return res.status(400).json({ success: false, message: '허용되지 않는 시간대입니다.' });
        }

        // user_id: 세션에서 가져오기 (authController에서 req.session.userId로 저장)
        const userId = getUserId(req);
        console.log('예약 요청 - userId:', userId, '| date:', visit_date, '| time:', visit_time, '| people:', count);

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: '로그인이 필요합니다.' 
            });
        }

        // ── user 테이블에서 회원 정보 자동 조회 ──
        const [userRows] = await db.query(
            `SELECT nickname, tel_number, email FROM user WHERE user_id = ?`,
            [userId]
        );
        const userInfo = userRows[0] || {};
        const finalVisitorName = visitor_name || userInfo.nickname || null;
        const finalPhone = phone || userInfo.tel_number || null;
        const finalEmail = email || userInfo.email || null;

        // ── 트랜잭션 시작 ──
        await conn.beginTransaction();

        // 해당 날짜+시간의 현재 예약 인원 (FOR UPDATE → 행 잠금)
        const [lockRows] = await conn.query(
            `SELECT COALESCE(SUM(people_count), 0) AS booked_count
             FROM reservation
             WHERE visit_date = ? AND visit_time = ? AND status IN ('BOOKED', 'pending', 'confirmed')
             FOR UPDATE`,
            [visit_date, visitTimeFull]
        );

        const currentBooked = Number(lockRows[0]?.booked_count || 0);
        const remaining = MAX_PEOPLE_PER_SLOT - currentBooked;

        if (count > remaining) {
            await conn.rollback();
            if (remaining <= 0) {
                return res.status(409).json({ success: false, message: '해당 시간대는 예약이 마감되었습니다.' });
            }
            return res.status(409).json({ success: false, message: `잔여석이 ${remaining}명뿐입니다. 인원을 줄여주세요.` });
        }

        // ── INSERT ──
        const [result] = await conn.query(
            `INSERT INTO reservation 
                (user_id, visit_date, visit_time, people_count, visitor_name, phone, email, status, memo)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [userId, visit_date, visitTimeFull, count, finalVisitorName, finalPhone, finalEmail, memo || null]
        );

        await conn.commit();

        // ── 예약 확인 이메일 자동 발송 (실패해도 예약은 유지) ──
        if (finalEmail) {
            const reservationData = {
                res_id: result.insertId,
                visitor_name: finalVisitorName,
                visit_date: visit_date,
                visit_time: visitTimeFull,
                people_count: count,
                phone: finalPhone,
                email: finalEmail
            };

            // 비동기로 발송 (응답 지연 방지)
            sendReservationEmail(finalEmail, reservationData)
                .then(() => console.log('✅ 예약 확인 메일 자동 발송 완료:', finalEmail))
                .catch(err => console.error('❌ 예약 확인 메일 자동 발송 실패:', err.message));
        }

        return res.json({
            success: true,
            res_id: result.insertId,
            message: '예약이 완료되었습니다.'
        });

    } catch (err) {
        await conn.rollback();
        console.error('createReservation error:', err);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    } finally {
        conn.release();
    }
};

/**
 * GET /api/reservation/detail?res_id=123
 * 예약 상세 정보 반환 (완료 페이지에서 사용)
 */
exports.getReservationDetail = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const { res_id } = req.query;
        if (!res_id) {
            return res.status(400).json({ success: false, message: '예약 번호가 필요합니다.' });
        }

        const [rows] = await db.query(
            `SELECT r.res_id, r.visit_date, r.visit_time, r.people_count, 
                    r.visitor_name, r.phone, r.email, r.status, r.memo, r.created_at
             FROM reservation r
             WHERE r.res_id = ? AND r.user_id = ?`,
            [res_id, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '예약을 찾을 수 없습니다.' });
        }

        return res.json({ success: true, reservation: rows[0] });

    } catch (err) {
        console.error('getReservationDetail error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * GET /api/reservation/my
 * 내 예약 목록 조회
 */
exports.getMyReservations = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const [rows] = await db.query(
            `SELECT res_id, visit_date, visit_time, people_count, visitor_name, phone, email, status, memo, created_at
             FROM reservation
             WHERE user_id = ?
             ORDER BY visit_date DESC, visit_time DESC`,
            [userId]
        );

        return res.json({ success: true, reservations: rows });

    } catch (err) {
        console.error('getMyReservations error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * PATCH /api/reservation/:resId/cancel
 * 예약 취소 (24시간 전까지만 가능)
 */
exports.cancelReservation = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const { resId } = req.params;

        // 예약 조회
        const [rows] = await db.query(
            `SELECT res_id, visit_date, visit_time, status
             FROM reservation
             WHERE res_id = ? AND user_id = ?`,
            [resId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '예약을 찾을 수 없습니다.' });
        }

        const reservation = rows[0];

        if (!['BOOKED', 'pending', 'confirmed'].includes(reservation.status)) {
            return res.status(400).json({ success: false, message: '이미 취소되었거나 완료된 예약입니다.' });
        }

        // 24시간 전 체크
        const visitDateTime = new Date(`${reservation.visit_date}T${reservation.visit_time}`);
        const now = new Date();
        const hoursUntil = (visitDateTime - now) / (1000 * 60 * 60);

        if (hoursUntil < 24) {
            return res.status(400).json({ success: false, message: '방문 24시간 이내에는 취소할 수 없습니다.' });
        }

        // 상태 변경
        await db.query(
            `UPDATE reservation SET status = 'cancelled' WHERE res_id = ?`,
            [resId]
        );

        return res.json({ success: true, message: '예약이 취소되었습니다.' });

    } catch (err) {
        console.error('cancelReservation error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * POST /api/reservation/send-email
 * 예약 확인 이메일 발송
 * 
 * Body: { res_id: 123 }
 */
exports.sendEmail = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }

        const { res_id } = req.body;
        if (!res_id) {
            return res.status(400).json({ success: false, message: '예약 번호가 필요합니다.' });
        }

        // 예약 조회 (본인 예약만)
        const [rows] = await db.query(
            `SELECT res_id, visit_date, visit_time, people_count, visitor_name, phone, email, status
             FROM reservation
             WHERE res_id = ? AND user_id = ?`,
            [res_id, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '예약을 찾을 수 없습니다.' });
        }

        const reservation = rows[0];

        if (!reservation.email) {
            return res.status(400).json({ success: false, message: '이메일 주소가 등록되지 않았습니다.' });
        }

        // 이메일 발송
        const result = await sendReservationEmail(reservation.email, reservation);

        if (result) {
            return res.json({ success: true, message: '예약 확인 메일이 발송되었습니다.' });
        } else {
            return res.status(500).json({ success: false, message: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' });
        }

    } catch (err) {
        console.error('sendEmail error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};