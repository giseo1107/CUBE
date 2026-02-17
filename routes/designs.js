// ============================================
// routes/designs.js
// 백엔드 서버에 이 파일을 그대로 추가
// ============================================

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// DB 연결 풀 (기존 연결 설정 사용)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ============================================
// POST /api/designs/save
// 디자인 저장 (신규/업데이트)
// ============================================
router.post('/save', async (req, res) => {
    try {
        const { user_id, title, design_data, is_public, custom_id } = req.body;

        // 필수 항목 검증
        if (!user_id || !title || !design_data) {
            return res.status(400).json({ 
                success: false, 
                message: '필수 항목이 누락되었습니다.' 
            });
        }

        let finalCustomId = custom_id;

        if (custom_id) {
            // 기존 디자인 업데이트
            const [result] = await pool.execute(
                `UPDATE designs 
                 SET title = ?, design_data = ?, is_public = ?, updated_at = NOW()
                 WHERE custom_id = ? AND user_id = ?`,
                [title, design_data, is_public || 1, custom_id, user_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: '디자인을 찾을 수 없습니다.' 
                });
            }
        } else {
            // 새 디자인 생성
            finalCustomId = `design_${uuidv4()}`;
            
            await pool.execute(
                `INSERT INTO designs (custom_id, user_id, title, design_data, is_public) 
                 VALUES (?, ?, ?, ?, ?)`,
                [finalCustomId, user_id, title, design_data, is_public || 1]
            );
        }

        res.json({
            success: true,
            custom_id: finalCustomId,
            message: '저장되었습니다.'
        });

    } catch (error) {
        console.error('디자인 저장 실패:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// ============================================
// GET /api/designs/my/:userId
// 내 디자인 목록 조회
// ============================================
router.get('/my/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [designs] = await pool.execute(
            `SELECT custom_id, title, created_at, updated_at 
             FROM designs 
             WHERE user_id = ? 
             ORDER BY updated_at DESC 
             LIMIT 100`,
            [userId]
        );

        res.json(designs);

    } catch (error) {
        console.error('디자인 목록 조회 실패:', error);
        res.status(500).json([]);
    }
});

// ============================================
// GET /api/designs/:customId
// 특정 디자인 불러오기
// ============================================
router.get('/:customId', async (req, res) => {
    try {
        const { customId } = req.params;

        const [designs] = await pool.execute(
            `SELECT * FROM designs WHERE custom_id = ?`,
            [customId]
        );

        if (designs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '디자인을 찾을 수 없습니다.' 
            });
        }

        res.json(designs[0]);

    } catch (error) {
        console.error('디자인 불러오기 실패:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// ============================================
// DELETE /api/designs/:customId/:userId
// 디자인 삭제
// ============================================
router.delete('/:customId/:userId', async (req, res) => {
    try {
        const { customId, userId } = req.params;

        const [result] = await pool.execute(
            `DELETE FROM designs WHERE custom_id = ? AND user_id = ?`,
            [customId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '디자인을 찾을 수 없거나 삭제 권한이 없습니다.' 
            });
        }

        res.json({ 
            success: true, 
            message: '삭제되었습니다.' 
        });

    } catch (error) {
        console.error('디자인 삭제 실패:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

module.exports = router;