const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const designsRoutes = require('./routes/designs');
const reservationRoutes = require('./routes/reservation');
const usedItemsRoute = require('./routes/usedItems');
const galleryRoutes = require('./routes/gallery');
const reviewRoutes = require('./routes/review');
const pool = require('./config/db');  // ← 기존 SSL 적용된 pool 가져오기

const sessionStore = new MySQLStore({}, pool);  // ← pool 직접 전달 (SSL 옵션 불필요)

const app = express();
const PORT = process.env.PORT || 3000;

// Render 등 리버스 프록시 환경에서 HTTPS 인식 (세션 설정보다 위에 있어야 함)
app.set('trust proxy', 1);

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
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    }
}));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/designs', designsRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/used-items', usedItemsRoute);
app.use('/api/gallery', galleryRoutes);
app.use('/api/reviews', reviewRoutes);

// 후기 상세 페이지 (깔끔한 URL)
app.get('/review/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reviewDetail.html'));
});

// 중고 큐브 상세 페이지 (깔끔한 URL)
app.get('/used/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'used_cube1.html'));
});

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