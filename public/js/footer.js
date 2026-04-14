/**
 * footer.js — C.C.C 공통 푸터
 * 사용법: 각 HTML </body> 바로 위에 아래 한 줄 추가
 * <script src="/js/footer.js"></script>
 *
 * 기존 <footer> 요소를 자동으로 교체합니다.
 */
(function () {

  // ── 스타일 주입 ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #g-footer {
      background-color: #1e2939;
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      margin-top: 80px;
    }

    #g-footer * { box-sizing: border-box; }

    /* 상단 콘텐츠 그리드 */
    #g-footer .gf-content {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 48px;
      padding: 56px clamp(32px, 6vw, 120px) 40px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    /* 컬럼 제목 */
    #g-footer .gf-col-title {
      font-family: "Arial-Bold", "Noto Sans KR", Helvetica, sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 20px 0;
    }

    /* 링크 목록 */
    #g-footer .gf-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    #g-footer .gf-links li a,
    #g-footer .gf-links li span {
      font-family: "Arial-Regular", "Noto Sans KR", Helvetica, sans-serif;
      font-size: 15px;
      color: #9fa8b4;
      text-decoration: none;
      transition: color 0.15s;
      cursor: pointer;
    }
    #g-footer .gf-links li a:hover { color: #aff9f5; }

    /* 브랜드 컬럼 */
    #g-footer .gf-brand {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    #g-footer .gf-brand-tagline {
      font-family: "Arial-Regular", "Noto Sans KR", Helvetica, sans-serif;
      font-size: 15px;
      color: #9fa8b4;
      line-height: 1.7;
      margin: 0;
    }
    #g-footer .gf-logo {
      width: 56px;
      height: 56px;
      background-image: url('/main_img/group-10@2x.png');
      background-size: cover;
      background-position: center;
      margin-top: 8px;
      flex-shrink: 0;
    }

    /* 하단 구분선 + 저작권 */
    #g-footer .gf-bottom {
      border-top: 1px solid #2d3748;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px clamp(32px, 6vw, 120px);
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      flex-wrap: wrap;
      gap: 12px;
    }
    #g-footer .gf-copyright {
      font-family: "Arial-Regular", "Noto Sans KR", Helvetica, sans-serif;
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    #g-footer .gf-bottom-logo {
      width: 32px;
      height: 32px;
      background-image: url('/main_img/group-10@2x.png');
      background-size: cover;
      background-position: center;
      opacity: 0.5;
    }

    /* 반응형 */
    @media (max-width: 900px) {
      #g-footer .gf-content {
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }
      #g-footer .gf-brand { grid-column: 1 / -1; }
    }
    @media (max-width: 560px) {
      #g-footer .gf-content {
        grid-template-columns: 1fr;
        gap: 28px;
        padding-top: 40px;
      }
    }
  `;
  document.head.appendChild(style);

  // ── footer HTML ─────────────────────────────────────────
  const footer = document.createElement('footer');
  footer.id = 'g-footer';
  footer.innerHTML = `
    <div class="gf-content">

      <!-- 고객 지원 -->
      <div>
        <p class="gf-col-title">고객 지원</p>
        <ul class="gf-links">
          <li><a href="/Qna.html">FAQ</a></li>
          <li><a href="/review.html">후기</a></li>
          <li><a href="/Question.html">1:1 문의</a></li>
          <li><a href="/visit-reservation.html">방문 예약</a></li>
        </ul>
      </div>

      <!-- 제품 -->
      <div>
        <p class="gf-col-title">제품</p>
        <ul class="gf-links">
          <li><a href="/editor.html">커스텀 큐브</a></li>
          <li><a href="/cubegallery.html">큐브 갤러리</a></li>
          <li><a href="/curation.html">큐레이션 샵</a></li>
          <li><a href="/usedItems.html">중고 큐브마켓</a></li>
        </ul>
      </div>

      <!-- 브랜드 -->
      <div class="gf-brand">
        <div class="gf-logo"></div>
        <p class="gf-brand-tagline">
          혁신적인 컨테이너 하우스로<br>새로운 주거 문화를 만들어갑니다
        </p>
      </div>

    </div>

    <div class="gf-bottom">
      <p class="gf-copyright">© 2026 Container House. All rights reserved.</p>
      <div class="gf-bottom-logo"></div>
    </div>
  `;

  // ── 기존 <footer> 교체 or body 끝에 추가 ───────────────
  function mount() {
    const existing = document.querySelector('footer');
    if (existing) {
      existing.replaceWith(footer);
    } else {
      document.body.appendChild(footer);
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', mount)
    : mount();

})();
