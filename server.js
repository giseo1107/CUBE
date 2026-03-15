const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const fs   = require('fs');
const cheerio = require('cheerio');
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

// ──────────────────────────────────────────────────────────────
// navbar.js 자동 주입 미들웨어 (express.static 보다 앞에 위치)
// ──────────────────────────────────────────────────────────────
const NAV_EXCLUDE = new Set([
    '/login.html',
    '/signup.html',
    '/verify-email.html',
]);

// ── 페이지별 제거할 선택자를 직접 지정 ──────────────────────
// 기본: nav, div.top-1, div.logo-nav, div.login 제거
// 특정 페이지만 다르게 처리하고 싶으면 여기에 추가
// ex) '/some-page.html': 'div.my-nav, div.my-header'
const NAV_CUSTOM = {
    '/visit-reservation.html': 'div.top-2',
};
// ─────────────────────────────────────────────────────────────

app.use((req, res, next) => {
    if (!req.path.endsWith('.html')) return next();
    if (NAV_EXCLUDE.has(req.path))   return next();

    const filePath = path.join(__dirname, 'public', req.path);
    if (!fs.existsSync(filePath))    return next();

    let html = fs.readFileSync(filePath, 'utf8');

    // ── cheerio로 네비게이션 제거 ─────────────────────────
    const $ = cheerio.load(html, { decodeEntities: false });

    if (NAV_CUSTOM[req.path]) {
        // 커스텀 선택자가 지정된 페이지: 해당 요소만 제거
        $(NAV_CUSTOM[req.path]).remove();
    } else {
        // 그 외 페이지: 기본 nav 요소 제거
        $('nav').remove();
        $('div.top-1, div.logo-nav, div.login').remove();
    }

    html = $.html();
    // ─────────────────────────────────────────────────────

    if (!html.includes('navbar.js')) {
        html = html.replace(
            '</body>',
            '  <script src="/js/navbar.js"></script>\n</body>'
        );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);  // ← return 명시
});
// ──────────────────────────────────────────────────────────────

// 정적 파일 제공 (HTML 제외 — navbar 미들웨어가 처리)
// index:false       → 루트 접근 시 index.html 자동 서빙 방지
// extensions:[]     → .html 확장자 자동 매핑 방지
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    extensions: [],
}));

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