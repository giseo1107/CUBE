const db = require('../config/db');

// answer 컬럼 없으면 자동 추가
db.execute(`ALTER TABLE qna_inquiries ADD COLUMN answer TEXT DEFAULT NULL`).catch(() => {});
db.execute(`ALTER TABLE qna_inquiries ADD COLUMN status VARCHAR(20) DEFAULT 'pending'`).catch(() => {});

const ADMIN_ID = 'admin';
const ADMIN_PW = 'admin';

// [POST] /api/admin/login
exports.login = (req, res) => {
  const { id, password } = req.body;
  if (id === ADMIN_ID && password === ADMIN_PW) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
};

// [POST] /api/admin/logout
exports.logout = (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
};

// [GET] /api/admin/check
exports.check = (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
};

// [GET] /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, email, nickname, created_at, email_verified
       FROM user ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [DELETE] /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    // 자식 테이블의 자식부터 삭제
    await db.execute(
      'DELETE ri FROM review_images ri JOIN reviews r ON ri.review_id = r.review_id WHERE r.user_id = ?', [id]
    );
    await db.execute(
      'DELETE p FROM payments p JOIN orders o ON p.order_id = o.order_id WHERE o.user_id = ?', [id]
    );
    // user_id 직접 참조 테이블 삭제
    await db.execute('DELETE FROM gallery_likes WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM reviews WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM orders WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM gallery_posts WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM cart WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM qna_inquiries WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM reservation WHERE user_id = ?', [id]);
    // 최종 유저 삭제
    await db.execute('DELETE FROM user WHERE user_id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/admin/orders
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.order_id, o.total_amount, o.status, o.ordered_at,
              u.email, u.nickname,
              p.item_name, p.payment_method_type, p.approved_at, p.tid
       FROM orders o
       LEFT JOIN user u ON o.user_id = u.user_id
       LEFT JOIN payments p ON o.order_id = p.order_id
       ORDER BY o.ordered_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/admin/reservations
exports.getReservations = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.res_id, r.visit_date, r.visit_time, r.people_count,
              r.status, r.created_at, r.visitor_name AS name, r.phone, r.email
       FROM reservation r
       ORDER BY r.visit_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [PATCH] /api/admin/reservations/:id
exports.updateReservation = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE reservation SET status = ? WHERE res_id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/admin/inquiries
exports.getInquiries = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT inquiry_id, type, name, email, phone, title, content, status, answer, created_at
       FROM qna_inquiries ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [POST] /api/admin/inquiries/:id/reply
exports.replyInquiry = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ success: false, message: '답변 내용을 입력해주세요.' });
    await db.execute(
      `UPDATE qna_inquiries SET answer = ?, status = 'answered' WHERE inquiry_id = ?`,
      [answer.trim(), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/admin/reviews
exports.getReviews = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.review_id, r.user_id, r.author_name, r.region, r.model_name,
              r.title, r.summary, r.rating_quality, r.rating_durability,
              r.rating_interior, r.rating_custom, r.rating_maintenance,
              r.rating_service, r.created_at, r.is_public
       FROM reviews r ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [DELETE] /api/admin/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    await db.execute('DELETE FROM reviews WHERE review_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/admin/gallery
exports.getGallery = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT gp.post_id, gp.title, gp.like_count, gp.view_count, gp.created_at,
              COALESCE(gp.author_name, u.nickname) AS author_name
       FROM gallery_posts gp
       LEFT JOIN user u ON gp.user_id = u.user_id
       ORDER BY gp.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [DELETE] /api/admin/gallery/:id
exports.deleteGallery = async (req, res) => {
  try {
    await db.execute('DELETE FROM gallery_posts WHERE post_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
