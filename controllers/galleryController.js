const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// gallery_likes 테이블 자동 생성
db.execute(`
  CREATE TABLE IF NOT EXISTS gallery_likes (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
  )
`).catch(e => console.error('[gallery] gallery_likes 테이블 생성 실패:', e));

// [GET] /api/gallery
exports.getPosts = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(20, parseInt(req.query.limit) || 6);
    const offset = (page - 1) * limit;
    const search = (req.query.q || '').trim();

    let where  = 'WHERE 1=1';
    let params = [];

    if (search) {
      where += ' AND (gp.title LIKE ? OR gp.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM gallery_posts gp ${where}`, params
    );
    const total = countRows[0].total;

    const [rows] = await db.execute(
      `SELECT gp.*, u.nickname AS author_name
       FROM gallery_posts gp
       LEFT JOIN users u ON gp.user_id = u.id
       ${where} ORDER BY gp.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[gallery] 목록 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// [GET] /api/gallery/:id
exports.getPostDetail = async (req, res) => {
  try {
    await db.execute(
      'UPDATE gallery_posts SET view_count = view_count + 1 WHERE post_id = ?',
      [req.params.id]
    );
    const [rows] = await db.execute(
      `SELECT gp.*, u.nickname AS author_name
       FROM gallery_posts gp
       LEFT JOIN users u ON gp.user_id = u.id
       WHERE gp.post_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    let liked = false;
    const userId = req.session?.user?.id;
    if (userId) {
      const [likeRows] = await db.execute(
        'SELECT 1 FROM gallery_likes WHERE user_id = ? AND post_id = ?',
        [userId, req.params.id]
      );
      liked = likeRows.length > 0;
    }

    res.json({ success: true, data: { ...rows[0], liked } });
  } catch (err) {
    console.error('[gallery] 상세 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// [POST] /api/gallery/:id/like  — 좋아요 토글
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const postId = req.params.id;
    const [existing] = await db.execute(
      'SELECT 1 FROM gallery_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length > 0) {
      await db.execute('DELETE FROM gallery_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      await db.execute('UPDATE gallery_posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = ?', [postId]);
    } else {
      await db.execute('INSERT INTO gallery_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      await db.execute('UPDATE gallery_posts SET like_count = like_count + 1 WHERE post_id = ?', [postId]);
    }

    const [updated] = await db.execute('SELECT like_count FROM gallery_posts WHERE post_id = ?', [postId]);
    res.json({ success: true, liked: existing.length === 0, likeCount: updated[0].like_count });
  } catch (err) {
    console.error('[gallery] 좋아요 처리 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// [POST] /api/gallery
exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }

    const userId   = req.session?.user?.id || 1;
    const imageUrl = req.file ? req.file.path : null;

    const [result] = await db.execute(
      'INSERT INTO gallery_posts (user_id, title, content, image_url) VALUES (?, ?, ?, ?)',
      [userId, title, content, imageUrl]
    );

    res.json({ success: true, postId: result.insertId });
  } catch (err) {
    console.error('[gallery] 글 등록 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// [DELETE] /api/gallery/:id
exports.deletePost = async (req, res) => {
  try {
    await db.execute('DELETE FROM gallery_posts WHERE post_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[gallery] 삭제 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};