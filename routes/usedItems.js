// ============================================================
// routes/usedItems.js  —  중고 큐브마켓 라우트
// ============================================================

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/useditemsController');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');

// ── Multer 이미지 업로드 설정 ─────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'usedcubeimg');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error('이미지 파일만 업로드 가능합니다.'), ok);
  },
});

// ── API 라우트 ────────────────────────────────────────────
router.get('/',         controller.getItems);      // 목록 (검색 + 페이지네이션)
router.get('/:id',      controller.getItemDetail); // 상세
router.post('/',        upload.array('images', 8), controller.createItem);  // 등록
router.delete('/:id',   controller.deleteItem);    // 삭제

module.exports = router;