const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const designsRoutes = require('./routes/designs');
const router = express.Router();
const reservationController = require('./controllers/reservationController');
const reservationRoutes = require('./routes/reservation');


// GET /api/reservation/capacity?date=2026-02-15
// → 해당 날짜의 시간대별 잔여석 조회
router.get('/capacity', reservationController.checkCapacity);

// GET /api/reservation/detail?res_id=123
// → 예약 상세 정보 조회 (완료 페이지에서 사용)
router.get('/detail', reservationController.getReservationDetail);

// POST /api/reservation/create
// → 예약 생성
router.post('/create', reservationController.createReservation);

// GET /api/reservation/my
// → 내 예약 목록 조회 (로그인 시)
router.get('/my', reservationController.getMyReservations);

// PATCH /api/reservation/:resId/cancel
// → 예약 취소
router.patch('/:resId/cancel', reservationController.cancelReservation);

module.exports = router;


const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 먼저 제공 (인증 불필요)
app.use(express.static(path.join(__dirname, 'public')));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    }
}));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/designs', designsRoutes);
app.use('/api/reservation', reservationRoutes);


app.set('trust proxy', 1);  
sameSite: 'lax',            

// 루트 경로는 로그인 페이지로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



// 404 에러 처리
app.use((req, res) => {
    res.status(404).json({ success: false, message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 에러 핸들링
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`큐브 서버가 포트 ${PORT}에서 실행중입니다.`);
    console.log(`http://localhost:${PORT}`);
});