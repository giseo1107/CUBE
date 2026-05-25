/**
 * 이메일 발송 유틸리티
 * utils/emailSender.js
 * 
 * .env의 EMAIL_PROVIDER 값으로 발송 방식 자동 전환:
 *   - "sendgrid"  → SendGrid API (클라우드 배포용, 권장)
 *   - "smtp"      → 기존 nodemailer SMTP (로컬 개발용)
 * 
 * 설치 (SendGrid 사용 시):
 *   npm install @sendgrid/mail
 */

require('dotenv').config();

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// ================================================================
// 발송 엔진 초기화
// ================================================================
let sendMail;

if (EMAIL_PROVIDER === 'sendgrid') {
  // ── SendGrid API ──
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  sendMail = async (mailOptions) => {
    const msg = {
      to: mailOptions.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM,
        name: process.env.SENDGRID_FROM_NAME || 'C.C.C Custom Cube Company'
      },
      subject: mailOptions.subject,
      html: mailOptions.html
    };
    await sgMail.send(msg);
  };

  console.log('📧 이메일 엔진: SendGrid');

} else {
  // ── SMTP (nodemailer, 기존 방식) ──
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  sendMail = async (mailOptions) => {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...mailOptions
    });
  };

  console.log('📧 이메일 엔진: SMTP (nodemailer)');
}

// ================================================================
// 공통 이메일 레이아웃
// ================================================================
function emailLayout(bodyContent) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; background-color: #f7f5fa; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

    <!-- 헤더 -->
    <div style="background: linear-gradient(135deg, #1a4f85 0%, #2a6ab0 100%); padding: 32px 40px;">
      <h1 style="color: #aff9f5; font-size: 32px; font-weight: 400; margin: 0 0 4px 0;">C.C.C</h1>
      <p style="color: rgba(175,249,245,0.7); font-size: 12px; margin: 0;">Custom Cube Company</p>
    </div>

    ${bodyContent}

    <!-- 푸터 -->
    <div style="background: #101828; padding: 24px 40px; text-align: center;">
      <p style="color: #99a1af; font-size: 12px; margin: 0; line-height: 1.6;">본 메일은 발신 전용입니다.</p>
      <p style="color: #99a1af; font-size: 12px; margin: 4px 0 0 0;">&copy; 2026 CUSTOM_CUBE_COMPANY. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ================================================================
// 1. 회원가입 이메일 인증
// ================================================================
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${SITE_URL}/verify-email.html?token=${token}`;

  const body = `
    <div style="padding: 32px 40px;">
      <h2 style="color: #101828; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">안녕하세요!</h2>
      <p style="color: #4a5565; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        큐브 회원가입을 환영합니다. 아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a4f85, #2a6ab0); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700;">이메일 인증하기</a>
      </div>
      <p style="color: #666; font-size: 13px; line-height: 1.6;">
        버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣어주세요:<br>
        <a href="${verificationUrl}" style="color: #1a4f85; word-break: break-all;">${verificationUrl}</a>
      </p>
      <p style="color: #e53e3e; font-size: 13px; margin-top: 16px;">⚠️ 이 링크는 24시간 동안만 유효합니다.</p>
    </div>`;

  try {
    await sendMail({
      to: email,
      subject: '[C.C.C] 이메일 인증을 완료해주세요',
      html: emailLayout(body)
    });
    console.log('✅ 인증 메일 발송 완료:', email);
    return true;
  } catch (error) {
    console.error('❌ 인증 메일 발송 실패:', error.message);
    return false;
  }
};

// ================================================================
// 2. 예약 확인 이메일
// ================================================================
const sendReservationEmail = async (toEmail, reservationData) => {
  const { res_id, visitor_name, visit_date, visit_time, people_count, phone, email: resEmail } = reservationData;

  // 날짜 포맷
  const days = ['일','월','화','수','목','금','토'];
  const d = new Date(visit_date);
  const formattedDate = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

  // 시간 포맷
  const t = String(visit_time).substring(0, 5);
  const hour = parseInt(t.split(':')[0]);
  const min = t.split(':')[1];
  const period = hour >= 12 ? '오후' : '오전';
  const dh = hour > 12 ? hour - 12 : hour;
  const formattedTime = `${period} ${dh}시${min !== '00' ? ' ' + min + '분' : ''} (${t})`;

  // 테이블 행 헬퍼
  function row(label, value, isLast) {
    const border = isLast ? '' : 'border-bottom: 1px solid #f0f0f5;';
    return `<tr>
      <td style="padding: 14px 16px; ${border} width: 100px; vertical-align: top;">
        <span style="color: #54537b; font-size: 13px;">${label}</span>
      </td>
      <td style="padding: 14px 16px; ${border} vertical-align: top;">
        <span style="color: #1a4f85; font-size: 15px; font-weight: 600;">${value}</span>
      </td>
    </tr>`;
  }

  const body = `
    <!-- 예약 번호 배너 -->
    <div style="background: linear-gradient(135deg, #15436f, #1a4f85); padding: 20px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color: rgba(255,255,255,0.8); font-size: 14px;">예약 번호</td>
        <td align="right" style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 1px;">RES-${res_id}</td>
      </tr></table>
    </div>

    <div style="padding: 32px 40px;">
      <h2 style="color: #101828; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
        ${visitor_name || '고객'}님, 예약이 확인되었습니다!
      </h2>
      <p style="color: #4a5565; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
        큐브 시리즈 방문 예약이 성공적으로 완료되었습니다. 아래 내용을 확인해 주세요.
      </p>

      <!-- 예약 상세 테이블 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
        ${row('방문 날짜', formattedDate)}
        ${row('방문 시간', formattedTime)}
        ${row('방문 인원', people_count + '명')}
        ${row('연락처', phone || '-')}
        ${row('이메일', resEmail || toEmail)}
        <tr>
          <td style="padding: 14px 16px; vertical-align: top;">
            <span style="color: #54537b; font-size: 13px;">방문 장소</span>
          </td>
          <td style="padding: 14px 16px; vertical-align: top;">
            <span style="color: #1a4f85; font-size: 15px; font-weight: 600;">C.C.C 큐브 시리즈 전시관</span>
            <p style="color: #4a5565; font-size: 13px; margin: 4px 0 0 0;">서울시 강남구 테헤란로 123 C.C.C 빌딩 1층</p>
          </td>
        </tr>
      </table>

      <!-- 안내사항 -->
      <div style="background: #f7f5fa; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
        <h3 style="color: #101828; font-size: 16px; font-weight: 700; margin: 0 0 16px 0;">방문 안내</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top; width: 36px;">
              <div style="width: 24px; height: 24px; background: #1a4f85; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px;">1</div>
            </td>
            <td style="padding-bottom: 12px; color: #4a5565; font-size: 14px; line-height: 1.5;">방문 1일 전, 담당자가 방문 확인 연락을 드립니다.</td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top;">
              <div style="width: 24px; height: 24px; background: #1a4f85; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px;">2</div>
            </td>
            <td style="padding-bottom: 12px; color: #4a5565; font-size: 14px; line-height: 1.5;">예약 시간 10분 전까지 전시관에 도착해 주세요.</td>
          </tr>
          <tr>
            <td style="vertical-align: top;">
              <div style="width: 24px; height: 24px; background: #1a4f85; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; text-align: center; line-height: 24px;">3</div>
            </td>
            <td style="color: #4a5565; font-size: 14px; line-height: 1.5;">예약 변경 및 취소는 방문 24시간 전까지 가능합니다.</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 8px 0;">
        <a href="${SITE_URL}/visit-reservation.html" style="display: inline-block; background: linear-gradient(135deg, #1a4f85, #2a6ab0); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700;">예약 관리 바로가기</a>
      </div>
    </div>`;

  try {
    await sendMail({
      to: toEmail,
      subject: `[C.C.C] 방문 예약이 확인되었습니다 (RES-${res_id})`,
      html: emailLayout(body)
    });
    console.log('✅ 예약 확인 메일 발송 완료:', toEmail, '| RES-' + res_id);
    return true;
  } catch (error) {
    console.error('❌ 예약 확인 메일 발송 실패:', error.message);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendReservationEmail };