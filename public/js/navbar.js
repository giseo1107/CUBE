/**
 * navbar.js — C.C.C 공통 네비게이션
 * 사용법: 각 HTML </body> 바로 위에 아래 한 줄 추가
 * <script src="/js/navbar.js"></script>
 */
(function () {

  // ── 메뉴 정의 ───────────────────────────────────────────
  const NAV_ITEMS = [
    { label: '커스텀 큐브',   href: 'editor.html' },
    { label: '큐브 갤러리',   href: 'cubegallery.html' },
    { label: '큐레이션 샵',   href: 'curation.html' },
    { label: '방문 예약',     href: 'visit-reservation.html' },
    { label: 'QnA 및 후기',  href: 'Qna.html' },
  ];

  // ── 현재 페이지 판별 ────────────────────────────────────
  const path = location.pathname;
  function isActive(href) {
    const page = href.replace('/', '').replace('.html', '');
    return path === href || path.includes(page);
  }

  // ── 스타일 주입 ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #g-nav {
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
      padding: 0 60px;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 9999;
      box-sizing: border-box;

      /* 기본: 완전 투명 */
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-bottom: 1px solid transparent;
      box-shadow: none;

      transition:
        background 0.35s ease,
        backdrop-filter 0.35s ease,
        -webkit-backdrop-filter 0.35s ease,
        border-color 0.35s ease,
        box-shadow 0.35s ease;
    }

    /* 스크롤 시: frosted glass */
    #g-nav.scrolled {
      background: rgba(26, 31, 46, 0.75);
      backdrop-filter: blur(18px) saturate(160%);
      -webkit-backdrop-filter: blur(18px) saturate(160%);
      border-bottom: 1px solid #364153;
      box-shadow: 0 2px 24px rgba(0, 0, 0, 0.3);
    }

    #g-nav * { box-sizing: border-box; }

    /* 내부 래퍼 */
    #g-nav .gn-inner {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* 로고 */
    #g-nav .gn-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }
    #g-nav .gn-logo-img {
      width: 64px;
      height: 64px;
      background-image: url('/main_img/group-10@2x.png');
      background-size: cover;
      background-position: center;
      flex-shrink: 0;
    }
    #g-nav .gn-logo-text { display: flex; flex-direction: column; }
    #g-nav .gn-logo-title {
      font-family: "Inter", Helvetica;
      font-size: 34px;
      font-weight: 400;
      color: #aff9f5;
      line-height: 1;
      letter-spacing: 0;
    }
    #g-nav .gn-logo-sub {
      font-family: "Inter", Helvetica;
      font-size: 13px;
      color: #aff9f5;
      opacity: 0.75;
      line-height: 1.4;
    }

    /* 메뉴 */
    #g-nav .gn-menu {
      display: flex;
      align-items: center;
      gap: 40px;
      list-style: none;
      flex: 1;
      justify-content: center;
      margin: 0;
      padding: 0;
    }
    #g-nav .gn-menu li a {
      font-family: "Baloo Da 2", "Arial-Regular", Helvetica;
      font-size: 24px;
      font-weight: 700;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      transition: color .15s;
      white-space: nowrap;
    }
    #g-nav .gn-menu li a:hover { color: #aff9f5; }
    #g-nav .gn-menu li.active a {
      color: #aff9f5;
      font-weight: 700;
    }

    /* 인증 영역 */
    #g-nav .gn-auth {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-shrink: 0;
    }
    #g-nav .gn-auth a,
    #g-nav .gn-auth button {
      font-family: "Baloo Da 2", "Arial-Regular", Helvetica;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color .15s;
    }
    #g-nav .gn-auth a:hover,
    #g-nav .gn-auth button:hover { color: #aff9f5; }

    /* 로그인 상태: 유저 정보 */
    #g-nav .gn-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* 아바타 래퍼 — 링크로 감싸기 */
    #g-nav .gn-avatar-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
    }

    #g-nav .gn-user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-size: 18px;
      flex-shrink: 0;
      border: 2px solid rgba(175, 249, 245, 0.4);
      transition: border-color 0.2s, opacity 0.2s;
    }
    #g-nav .gn-user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* hover 시 아바타 어둡게 */
    #g-nav .gn-avatar-wrap:hover .gn-user-avatar {
      border-color: #aff9f5;
      opacity: 0.75;
    }

    /* hover 툴팁 */
    #g-nav .gn-avatar-tooltip {
      position: absolute;
      top: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 24, 40, 0.92);
      color: #fff;
      font-family: "Baloo Da 2", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      padding: 6px 12px;
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10000;
    }
    /* 툴팁 화살표 */
    #g-nav .gn-avatar-tooltip::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-bottom-color: rgba(16, 24, 40, 0.92);
    }
    #g-nav .gn-avatar-wrap:hover .gn-avatar-tooltip {
      opacity: 1;
    }
    #g-nav .gn-user-name {
      font-family: "Baloo Da 2", "Arial-Regular", Helvetica;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
    }
    #g-nav .gn-btn-logout {
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      font-family: "Baloo Da 2", "Arial-Regular", Helvetica;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
    }
    #g-nav .gn-btn-logout:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    /* 바디 여백 제거 (히어로 이미지와 자연스럽게 연동) */
    body { padding-top: 0 !important; }
  `;
  document.head.appendChild(style);

  // ── navbar HTML 생성 ────────────────────────────────────
  const menuHTML = NAV_ITEMS.map(item =>
    `<li class="${isActive(item.href) ? 'active' : ''}">
       <a href="${item.href}">${item.label}</a>
     </li>`
  ).join('');

  const nav = document.createElement('nav');
  nav.id = 'g-nav';
  nav.innerHTML = `
    <div class="gn-inner">
      <a href="/index.html" class="gn-logo">
        <div class="gn-logo-img"></div>
      </a>
      <ul class="gn-menu">${menuHTML}</ul>
      <div class="gn-auth" id="gn-auth">
        <a href="/login.html">로그인</a>
        <a href="/signup.html">회원가입</a>
      </div>
    </div>
  `;

  // ── 스크롤 이벤트 → frosted glass 전환 ─────────────────
  const SCROLL_THRESHOLD = 60; // px — 이 이상 내려가면 효과 적용

  function initScroll() {
    // data-nav="hero" 가 있는 페이지만 투명 시작 → 스크롤 시 frosted glass
    // 그 외 페이지는 항상 불투명 (밝은 배경에서도 navbar가 보이도록)
    const isHero = document.body.dataset.nav === 'hero';

    if (!isHero) {
      // 비히어로 페이지: 처음부터 scrolled 상태 고정
      nav.classList.add('scrolled');
      return;
    }

    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 초기 상태 즉시 적용
  }

  // ── body 최상단에 삽입 ──────────────────────────────────
  function mount() {
    // 기존 navbar가 있으면 숨김 (충돌 방지)
    document.querySelectorAll('.navbar, nav:not(#g-nav)').forEach(el => {
      el.style.display = 'none';
    });
    document.body.insertBefore(nav, document.body.firstChild);
    checkAuth();
    initScroll();
  }

  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);

  // ── 로그인 상태 반영 ────────────────────────────────────
  async function checkAuth() {
    const authEl = document.getElementById('gn-auth');
    if (!authEl) return;

    try {
      const res  = await fetch('/api/user/info');
      const data = await res.json();

      if (data.success && data.user) {
        const user = data.user;
        const avatarHTML = user.profile_image
          ? `<img src="${user.profile_image}" alt="프로필">`
          : `<span>👤</span>`;

        authEl.innerHTML = `
          <div class="gn-user-info">
            <a href="/mypage.html" class="gn-avatar-wrap">
              <div class="gn-user-avatar">${avatarHTML}</div>
              <span class="gn-avatar-tooltip">프로필 이미지를 클릭하면 마이페이지로 이동합니다</span>
            </a>
            <span class="gn-user-name">${user.nickname || user.email || '사용자'}</span>
            <button class="gn-btn-logout" id="gn-logout">로그아웃</button>
          </div>
        `;

        document.getElementById('gn-logout').addEventListener('click', async () => {
          if (!confirm('로그아웃 하시겠습니까?')) return;
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            location.reload();
          } catch { location.href = '/login.html'; }
        });
      }
    } catch { /* 기본 로그인/회원가입 유지 */ }
  }

})();