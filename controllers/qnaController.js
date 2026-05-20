const db = require('../config/db');

// qna_inquiries 테이블 자동 생성
db.execute(`
  CREATE TABLE IF NOT EXISTS qna_inquiries (
    inquiry_id  INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          DEFAULT NULL,
    type        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(30)  NOT NULL,
    email       VARCHAR(200) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    content     TEXT         NOT NULL,
    answer      TEXT         DEFAULT NULL,
    status      VARCHAR(20)  DEFAULT 'pending',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inquiry_id)
  )
`).catch(e => console.error('[qna] 테이블 생성 실패:', e));

// ─────────────────────────────────────────
// [POST] /api/qna/inquiries  — 1:1 문의 접수
// ─────────────────────────────────────────
exports.createInquiry = async (req, res) => {
  try {
    const { type, name, phone, email, title, content } = req.body;

    // 서버 측 검증
    if (!type || !name || !phone || !email || !title || !content) {
      return res.status(400).json({ success: false, message: '모든 필수 항목을 입력해주세요.' });
    }
    if (content.trim().length < 10) {
      return res.status(400).json({ success: false, message: '문의 내용을 10자 이상 입력해주세요.' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: '올바른 이메일 형식이 아닙니다.' });
    }

    const userId = req.session?.userId || null;

    const [result] = await db.execute(
      `INSERT INTO qna_inquiries (user_id, type, name, phone, email, title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, name.trim(), phone.trim(), email.trim(), title.trim(), content.trim()]
    );

    res.json({ success: true, inquiryId: result.insertId });
  } catch (err) {
    console.error('[qna] 문의 접수 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [GET] /api/qna/inquiries  — 내 문의 목록 (로그인 필요)
// ─────────────────────────────────────────
exports.getMyInquiries = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const [rows] = await db.execute(
      `SELECT inquiry_id, type, title, content, status, answer, created_at
       FROM qna_inquiries
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[qna] 문의 목록 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [GET] /api/qna/reviews  — 공개 후기 목록
// ─────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const limit   = Math.min(20, parseInt(req.query.limit) || 10);
    const offset  = (page - 1) * limit;
    const keyword = (req.query.keyword || '').trim();

    const where  = keyword
      ? `WHERE is_public = 1 AND (title LIKE ? OR content LIKE ? OR author_name LIKE ?)`
      : `WHERE is_public = 1`;
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : [];

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM qna_reviews ${where}`, params
    );

    const [rows] = await db.execute(
      `SELECT review_id, title, content, rating, author_name, created_at
       FROM qna_reviews
       ${where}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [...params]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[qna] 후기 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};