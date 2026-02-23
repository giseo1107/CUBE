// ============================================================
// controllers/usedItemsController.js  —  중고 큐브마켓 컨트롤러
// ============================================================

const db = require('../config/db');   // ← 기존 DB 커넥션 모듈 (아래 참고)

// ── 가격 문자열 → 숫자 변환 ──────────────────────────────
// "1,850만원" → 18500000  |  "3200" → 3200
function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₩,\s원]/g, '');
  if (cleaned.includes('만')) {
    return Math.round(parseFloat(cleaned.replace('만', '')) * 10000);
  }
  return parseInt(cleaned) || 0;
}

// ── 가격 숫자 → 표시 문자열 변환 ─────────────────────────
// 18500000 → "₩ 1,850만원"
function formatPrice(num) {
  if (!num) return '₩ 0';
  if (num >= 10000) {
    const man = num / 10000;
    return `₩ ${man.toLocaleString()}만원`;
  }
  return `₩ ${num.toLocaleString()}원`;
}

// ============================================================
//  [GET] /api/used-items  —  목록 (검색 + 페이지네이션)
// ============================================================
exports.getItems = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(40, parseInt(req.query.limit) || 8);
    const offset = (page - 1) * limit;
    const search = (req.query.q || '').trim();

    let where  = 'WHERE i.status = ?';
    let params = ['SELLING'];

    if (search) {
      where += ' AND (i.title LIKE ? OR i.location LIKE ? OR i.tags LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    // 총 개수
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM used_items i ${where}`,
      params
    );
    const total = countRows[0].total;

    // 목록 + 대표 이미지
    const [rows] = await db.execute(
      `SELECT i.*,
              (SELECT file_path FROM used_item_images
               WHERE item_id = i.item_id ORDER BY sort_order LIMIT 1) AS thumbnail
       FROM used_items i
       ${where}
       ORDER BY i.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // 가격 포맷 추가
    const data = rows.map(r => ({
      ...r,
      price_display: formatPrice(r.price),
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    });

  } catch (err) {
    console.error('[usedItems] 목록 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
//  [GET] /api/used-items/:id  —  상세
// ============================================================
exports.getItemDetail = async (req, res) => {
  try {
    const itemId = req.params.id;

    // 조회수 +1
    await db.execute(
      'UPDATE used_items SET view_count = view_count + 1 WHERE item_id = ?',
      [itemId]
    );

    const [itemRows] = await db.execute(
      'SELECT * FROM used_items WHERE item_id = ?',
      [itemId]
    );
    if (itemRows.length === 0) {
      return res.status(404).json({ success: false, message: '매물을 찾을 수 없습니다.' });
    }

    const [images] = await db.execute(
      'SELECT * FROM used_item_images WHERE item_id = ? ORDER BY sort_order',
      [itemId]
    );

    const item = {
      ...itemRows[0],
      price_display: formatPrice(itemRows[0].price),
      images,
    };

    res.json({ success: true, data: item });

  } catch (err) {
    console.error('[usedItems] 상세 조회 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
//  [POST] /api/used-items  —  등록
// ============================================================
exports.createItem = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      title, price, description, location,
      size_info, structure, build_year,
      condition, interior, insulation, tags,
    } = req.body;

    // TODO: 로그인 세션에서 seller_id 가져오기
    const sellerId = req.session?.user?.id || 1;

    const priceNum = parsePrice(price);

    const [result] = await conn.execute(
      `INSERT INTO used_items
        (seller_id, title, price, description, location,
         size_info, structure, build_year, \`condition\`, interior, insulation, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId, title, priceNum, description || '', location || '',
        size_info || null, structure || null, build_year || null,
        condition || null, interior || null, insulation || null, tags || null,
      ]
    );

    const itemId = result.insertId;

    // 이미지 저장
    if (req.files && req.files.length > 0) {
      const imgValues = req.files.map((f, i) => [
        itemId,
        `/usedcubeimg/${f.filename}`,
        i,
      ]);
      await conn.query(
        'INSERT INTO used_item_images (item_id, file_path, sort_order) VALUES ?',
        [imgValues]
      );
    }

    await conn.commit();
    res.json({ success: true, itemId });

  } catch (err) {
    await conn.rollback();
    console.error('[usedItems] 등록 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ============================================================
//  [DELETE] /api/used-items/:id  —  삭제
// ============================================================
exports.deleteItem = async (req, res) => {
  try {
    // TODO: 본인 확인 (seller_id == 로그인 사용자)
    await db.execute(
      'DELETE FROM used_items WHERE item_id = ?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[usedItems] 삭제 실패:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};