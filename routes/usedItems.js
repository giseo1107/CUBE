// ============================================================
// routes/usedItems.js  —  중고 큐브마켓 라우트
// ============================================================

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/used-items-controller');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path       = require('path');
const fs         = require('fs');

// ── Multer 이미지 업로드 설정 ─────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'joljak/used-items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── API 라우트 ────────────────────────────────────────────
router.get('/',         controller.getItems);      // 목록 (검색 + 페이지네이션)
router.get('/:id',      controller.getItemDetail); // 상세
router.post('/',        upload.array('images', 8), controller.createItem);  // 등록
router.delete('/:id',   controller.deleteItem);    // 삭제

module.exports = router;