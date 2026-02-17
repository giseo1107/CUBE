// 로그인 확인 미들웨어
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

// 로그인 상태 확인 (JSON 응답)
exports.checkAuth = (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ 
      success: true, 
      authenticated: true,
      userId: req.session.userId,
      email: req.session.email
    });
  } else {
    res.json({ success: true, authenticated: false });
  }
};