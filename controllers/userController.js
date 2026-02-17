const db = require('../config/db');
const bcrypt = require('bcrypt');

// 사용자 정보 조회
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.session.userId;

    const [users] = await db.query(
      'SELECT user_id, email, nickname, tel_number, address, address_detail, profile_image, marketing_agree FROM user WHERE user_id = ?',
      [userId]
    );

    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

// 사용자 정보 수정
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { nickname, tel_number, address, address_detail, marketing_agree } = req.body;

    await db.query(
      'UPDATE user SET nickname = ?, tel_number = ?, address = ?, address_detail = ?, marketing_agree = ? WHERE user_id = ?',
      [nickname, tel_number, address, address_detail, marketing_agree, userId]
    );

    res.json({ success: true, message: '회원정보가 수정되었습니다.' });
  } catch (error) {
    console.error('정보 수정 오류:', error);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

// 프로필 이미지 업데이트
exports.updateProfileImage = async (req, res) => {
  console.log('=== 프로필 이미지 업로드 시작 ===');
  console.log('User ID:', req.session.userId);
  
  try {
    const userId = req.session.userId;
    const { profileImage } = req.body;

    // 데이터 검증
    if (!profileImage) {
      console.log('❌ 이미지 데이터 없음');
      return res.json({ success: false, message: '이미지 데이터가 없습니다.' });
    }

    console.log('이미지 데이터 길이:', profileImage.length);

    // Base64 형식 확인
    if (!profileImage.startsWith('data:image/')) {
      console.log('❌ 유효하지 않은 이미지 형식');
      return res.json({ success: false, message: '유효하지 않은 이미지 형식입니다.' });
    }

    // 이미지 크기 제한 체크 (약 5MB in Base64)
    if (profileImage.length > 7000000) {
      console.log('❌ 이미지 크기 초과');
      return res.json({ success: false, message: '이미지 크기가 너무 큽니다. (5MB 이하)' });
    }

    console.log('DB 업데이트 시도...');
    
    // DB 업데이트
    const [result] = await db.query(
      'UPDATE user SET profile_image = ? WHERE user_id = ?',
      [profileImage, userId]
    );

    console.log('DB 업데이트 결과:', result);

    if (result.affectedRows > 0) {
      console.log('✅ 업데이트 성공');
      res.json({ success: true, message: '프로필 이미지가 업데이트되었습니다.' });
    } else {
      console.log('❌ affectedRows = 0');
      res.json({ success: false, message: '업데이트에 실패했습니다.' });
    }

  } catch (error) {
    console.error('❌❌❌ 프로필 이미지 업로드 오류 ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: error.message 
    });
  }
};

// ⭐⭐⭐ 프로필 이미지 삭제 (이 함수를 추가하세요!) ⭐⭐⭐
exports.deleteProfileImage = async (req, res) => {
  console.log('=== 프로필 이미지 삭제 API 호출됨 ===');
  console.log('User ID:', req.session.userId);
  
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    console.log('DB 업데이트 시도... (profile_image를 NULL로 설정)');
    
    // DB에서 이미지 삭제 (NULL로 설정)
    const [result] = await db.query(
      'UPDATE user SET profile_image = NULL WHERE user_id = ?',
      [userId]
    );

    console.log('DB 업데이트 결과:', result);

    if (result.affectedRows > 0) {
      console.log('✅ 삭제 성공');
      res.json({ success: true, message: '프로필 이미지가 삭제되었습니다.' });
    } else {
      console.log('❌ affectedRows = 0');
      res.json({ success: false, message: '삭제에 실패했습니다.' });
    }

  } catch (error) {
    console.error('❌❌❌ 프로필 이미지 삭제 오류 ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error: error.message 
    });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    // 현재 비밀번호 확인
    const [users] = await db.query(
      'SELECT password FROM user WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);

    if (!isMatch) {
      return res.json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await db.query(
      'UPDATE user SET password = ? WHERE user_id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

// 회원 탈퇴
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { password } = req.body;

    // 비밀번호 확인
    const [users] = await db.query(
      'SELECT password FROM user WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(password, users[0].password);

    if (!isMatch) {
      return res.json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 회원 삭제
    await db.query('DELETE FROM user WHERE user_id = ?', [userId]);

    // 세션 삭제
    req.session.destroy();

    res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};