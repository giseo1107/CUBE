const db         = require('../config/db');
const cloudinary = require('cloudinary').v2;

// ─────────────────────────────────────────
// [GET] /api/reviews  — 후기 목록 (공개)
// ─────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)    || 1);
    const limit   = Math.min(20, parseInt(req.query.limit)  || 6);
    const offset  = (page - 1) * limit;
    const keyword = (req.query.keyword || '').trim();

    const where  = keyword
      ? `WHERE r.is_public = 1 AND (r.title LIKE ? OR r.summary LIKE ? OR r.content LIKE ? OR r.author_name LIKE ?)`
      : `WHERE r.is_public = 1`;
    const params = keyword
      ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
      : [];

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM reviews r ${where}`, params
    );

    const [rows] = await db.execute(
      `SELECT r.review_id, r.user_id, r.author_name, r.region, r.model_name,
              r.title, r.summary, r.content,
              r.rating_quality, r.rating_durability, r.rating_interior,
              r.rating_custom, r.rating_maintenance, r.rating_service,
              r.created_at,
              (SELECT image_url FROM review_images
               WHERE review_id = r.review_id ORDER BY sort_order LIMIT 1) AS image_url
       FROM reviews r
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [...params]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[reviews] 목록 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [GET] /api/reviews/:id  — 후기 상세
// ─────────────────────────────────────────
exports.getReviewById = async (req, res) => {
  try {
    const [[row]] = await db.execute(
      `SELECT * FROM reviews WHERE review_id = ? AND is_public = 1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: '후기를 찾을 수 없습니다.' });

    // 사진 목록 함께 조회
    const [images] = await db.execute(
      `SELECT image_url FROM review_images
       WHERE review_id = ? ORDER BY sort_order ASC`,
      [req.params.id]
    );
    row.images = images.map(i => i.image_url);

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[reviews] 상세 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [POST] /api/reviews  — 후기 등록 (로그인 필요)
// ─────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const {
      name, region, model_name, title, summary, content,
      image_urls,  // ← 배열로 받음
      rating_quality, rating_durability, rating_interior,
      rating_custom, rating_maintenance, rating_service,
    } = req.body;

    // 서버 측 검증
    const required = { name, region, model_name, title, summary, content };
    for (const [key, val] of Object.entries(required)) {
      if (!val?.trim()) return res.status(400).json({ success: false, message: `${key} 항목을 입력해주세요.` });
    }
    if (content.trim().length < 10) {
      return res.status(400).json({ success: false, message: '후기 내용을 10자 이상 입력해주세요.' });
    }
    const ratings = [rating_quality, rating_durability, rating_interior, rating_custom, rating_maintenance, rating_service];
    if (ratings.some(r => !r || r < 1 || r > 5)) {
      return res.status(400).json({ success: false, message: '모든 항목의 별점을 선택해주세요.' });
    }

    // 후기 저장
    const [result] = await db.execute(
      `INSERT INTO reviews
         (user_id, author_name, region, model_name, title, summary, content,
          rating_quality, rating_durability, rating_interior,
          rating_custom, rating_maintenance, rating_service)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        name.trim(), region.trim(), model_name.trim(),
        title.trim(), summary.trim(), content.trim(),
        rating_quality, rating_durability, rating_interior,
        rating_custom, rating_maintenance, rating_service,
      ]
    );

    const reviewId = result.insertId;

    // 사진 저장 (있는 경우만)
    if (Array.isArray(image_urls) && image_urls.length > 0) {
      const imageValues = image_urls.map((url, idx) => [reviewId, url, idx]);
      for (const [rid, url, order] of imageValues) {
        await db.execute(
          `INSERT INTO review_images (review_id, image_url, sort_order) VALUES (?, ?, ?)`,
          [rid, url, order]
        );
      }
    }

    res.json({ success: true, reviewId });
  } catch (err) {
    console.error('[reviews] 등록 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [POST] /api/reviews/upload  — 사진 업로드 (Cloudinary)
// ─────────────────────────────────────────
exports.uploadImages = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: '업로드할 파일이 없습니다.' });
    }

    const urls = await Promise.all(
      req.files.map(file =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'ccc/reviews', resource_type: 'image' },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
          );
          stream.end(file.buffer);
        })
      )
    );

    res.json({ success: true, urls });
  } catch (err) {
    console.error('[reviews] 이미지 업로드 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [PUT] /api/reviews/:id  — 후기 수정 (본인만)
// ─────────────────────────────────────────
exports.updateReview = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    const [[row]] = await db.execute(
      `SELECT user_id FROM reviews WHERE review_id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: '후기를 찾을 수 없습니다.' });
    if (row.user_id !== req.session.userId) {
      return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
    }

    const {
      name, region, model_name, title, summary, content,
      rating_quality, rating_durability, rating_interior,
      rating_custom, rating_maintenance, rating_service,
    } = req.body;

    await db.execute(
      `UPDATE reviews SET
         author_name=?, region=?, model_name=?, title=?, summary=?, content=?,
         rating_quality=?, rating_durability=?, rating_interior=?,
         rating_custom=?, rating_maintenance=?, rating_service=?
       WHERE review_id=?`,
      [name, region, model_name, title, summary, content,
       rating_quality, rating_durability, rating_interior,
       rating_custom, rating_maintenance, rating_service,
       req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[reviews] 수정 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// [DELETE] /api/reviews/:id  — 후기 삭제 (본인만)
// ─────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const [[row]] = await db.execute(
      `SELECT user_id FROM reviews WHERE review_id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: '후기를 찾을 수 없습니다.' });
    if (row.user_id !== req.session.userId) {
      return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
    }

    // ON DELETE CASCADE로 review_images도 자동 삭제
    await db.execute(`DELETE FROM reviews WHERE review_id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[reviews] 삭제 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};