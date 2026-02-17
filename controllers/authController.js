const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/emailSender');

// 회원가입
exports.signup = async (req, res) => {
  const { email, password, nickname, tel_number, address, address_detail, marketing_agree } = req.body;

  try {
    // 이메일 중복 체크
    const [existingUser] = await db.query('SELECT user_id FROM user WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: '이미 사용중인 이메일입니다.' });
    }

    // 닉네임 중복 체크
    const [existingNickname] = await db.query('SELECT user_id FROM user WHERE nickname = ?', [nickname]);
    if (existingNickname.length > 0) {
      return res.status(400).json({ success: false, message: '이미 사용중인 닉네임입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이메일 인증 토큰 생성
    const verificationToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

    // 사용자 등록 (이메일 미인증 상태)
    const [result] = await db.query(
      `INSERT INTO user (email, password, nickname, tel_number, address, address_detail, 
       marketing_agree, email_verified, email_verification_token, token_expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [email, hashedPassword, nickname, tel_number, address, address_detail || null, 
       marketing_agree ? 1 : 0, verificationToken, tokenExpiresAt]
    );

    // 인증 이메일 발송
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: '회원가입은 완료되었으나 인증 메일 발송에 실패했습니다. 로그인 후 재발송을 시도해주세요.' 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
};

// 이메일 인증
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const [users] = await db.query(
      'SELECT user_id, email, email_verified, token_expires_at FROM user WHERE email_verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '유효하지 않은 인증 링크입니다.' });
    }

    const user = users[0];

    // 이미 인증된 경우
    if (user.email_verified === 1) {
      return res.json({ success: true, message: '이미 인증된 계정입니다.', alreadyVerified: true });
    }

    // 토큰 만료 체크
    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({ success: false, message: '인증 링크가 만료되었습니다. 재발송을 요청해주세요.' });
    }

    // 이메일 인증 완료
    const [updateResult] = await db.query(
      'UPDATE user SET email_verified = 1, email_verification_token = NULL, token_expires_at = NULL WHERE user_id = ?',
      [user.user_id]
    );

    console.log('이메일 인증 완료:', user.email, '업데이트 결과:', updateResult);

    res.json({ success: true, message: '이메일 인증이 완료되었습니다. 이제 로그인하실 수 있습니다.' });

  } catch (error) {
    console.error('이메일 인증 오류:', error);
    res.status(500).json({ success: false, message: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 인증 메일 재발송
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query('SELECT user_id, email_verified FROM user WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '등록되지 않은 이메일입니다.' });
    }

    const user = users[0];

    if (user.email_verified === 1) {
      return res.status(400).json({ success: false, message: '이미 인증된 계정입니다.' });
    }

    // 새로운 토큰 생성
    const verificationToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE user SET email_verification_token = ?, token_expires_at = ? WHERE user_id = ?',
      [verificationToken, tokenExpiresAt, user.user_id]
    );

    // 인증 이메일 재발송
    const emailSent = await sendVerificationEmail(email, verificationToken);

    if (!emailSent) {
      return res.status(500).json({ success: false, message: '메일 발송에 실패했습니다.' });
    }

    res.json({ success: true, message: '인증 메일이 재발송되었습니다. 이메일을 확인해주세요.' });

  } catch (error) {
    console.error('메일 재발송 오류:', error);
    res.status(500).json({ success: false, message: '메일 재발송 중 오류가 발생했습니다.' });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT user_id, email, password, nickname, email_verified FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 이메일 인증 여부 확인
    console.log('로그인 시도:', user.email, 'email_verified:', user.email_verified);
    if (user.email_verified === 0) {
      console.log('이메일 미인증 사용자');
      return res.status(403).json({ 
        success: false, 
        message: '이메일 인증이 필요합니다.',
        needsVerification: true,
        email: user.email
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 세션에 사용자 정보 저장
    req.session.userId = user.user_id;
    req.session.email = user.email;

    res.json({ 
      success: true, 
      message: '로그인 성공',
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '로그아웃 실패' });
    }
    res.json({ success: true, message: '로그아웃 되었습니다.' });
  });
};