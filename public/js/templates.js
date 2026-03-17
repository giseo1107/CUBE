/**
 * templates.js — 에디터 템플릿 데이터
 *
 * 성향별 추천 템플릿 (5종) + 빈 공간 템플릿 (3종) = 총 8종
 *
 * 새 템플릿 추가 방법:
 *   1. TEMPLATES 객체에 새 key 추가 (예: 'cafe')
 *   2. editor.html의 <select id="templateSelect">에 <option> 추가
 *   3. 성향 분석 연동 시 PROPENSITY_TO_TEMPLATE에도 매핑 추가
 *
 * 구조:
 *   TEMPLATES.{key} = {
 *     name, description, features[], targetPyeong, estimatedCost,
 *     roomSize: { width, height },
 *     furniture: [{ left, top, width, height, fill, name, h, texture, elevation? }]
 *   }
 */

// ============ 템플릿 데이터 (성향별 최적화) ============
const TEMPLATES = {
    // ========== 단기 투자형 ==========
    // 특징: 소형, 미니멀, 저비용, 빠른 설치/철거, 팝업스토어/프로모션 적합
    shortterm: {
        name: "팝업창업형",
        description: "팝업스토어, 브랜드 프로모션에 최적화된 컴팩트한 공간입니다. 빠른 설치와 철거가 가능하며, 최소한의 가구로 효율적인 공간 활용이 가능합니다.",
        features: ["⚡ 빠른 설치/철거", "💰 저비용 운영", "🎯 브랜딩 집중", "📦 이동 용이"],
        targetPyeong: "3~5평",
        estimatedCost: "1,000만원 ~ 2,000만원",
        roomSize: { width: 350, height: 300 },
        furniture: [
            // 벽면 (최소화)
            { left: 0, top: 0, width: 350, height: 12, fill: '#b0bec5', name: 'Wall_뒤벽', h: 240, texture: 'color' },
            { left: 0, top: 12, width: 12, height: 288, fill: '#b0bec5', name: 'Wall_왼벽', h: 240, texture: 'color' },
            { left: 338, top: 12, width: 12, height: 200, fill: '#b0bec5', name: 'Wall_오른벽', h: 240, texture: 'color' },
            { left: 12, top: 288, width: 326, height: 12, fill: '#b0bec5', name: 'Wall_아래벽', h: 240, texture: 'color' },
            // 창문 & 출입구
            { left: 100, top: 0, width: 150, height: 10, fill: '#81ecec', name: 'Window_전시창', h: 180, elevation: 30, texture: 'glass' },
            { left: 338, top: 212, width: 10, height: 76, fill: '#a0522d', name: 'Door_출입구', h: 210, texture: 'wood' },
            // 전시/프로모션 가구
            { left: 30, top: 30, width: 120, height: 60, fill: '#ffffff', name: 'Table_전시대1', h: 90, texture: 'color' },
            { left: 200, top: 30, width: 120, height: 60, fill: '#ffffff', name: 'Table_전시대2', h: 90, texture: 'color' },
            { left: 80, top: 150, width: 180, height: 80, fill: '#f5f5f5', name: 'Table_메인전시', h: 75, texture: 'color' },
            { left: 160, top: 100, width: 25, height: 25, fill: '#ffd700', name: 'Lamp_스팟조명', h: 200, texture: 'metal' }
        ]
    },

    // ========== 장기 투자형 ==========
    // 특징: 중대형, 고급 마감재, 카페/상업시설, 지속적 수익 창출
    longterm: {
        name: "안정정착형",
        description: "카페, 사무실 등 장기 운영에 최적화된 프리미엄 공간입니다. 고급 마감재와 내구성 있는 가구로 구성되어 지속적인 수익 창출이 가능합니다.",
        features: ["🏆 프리미엄 마감", "💎 고급 인테리어", "📈 수익성 극대화", "🔧 낮은 유지비"],
        targetPyeong: "10~15평",
        estimatedCost: "5,000만원 ~ 8,000만원",
        roomSize: { width: 700, height: 600 },
        furniture: [
            // 프리미엄 벽면
            { left: 0, top: 0, width: 700, height: 20, fill: '#eceff1', name: 'Wall_뒤벽', h: 300, texture: 'marble' },
            { left: 0, top: 20, width: 20, height: 580, fill: '#eceff1', name: 'Wall_왼벽', h: 300, texture: 'marble' },
            { left: 680, top: 20, width: 20, height: 450, fill: '#eceff1', name: 'Wall_오른벽', h: 300, texture: 'marble' },
            { left: 20, top: 580, width: 660, height: 20, fill: '#eceff1', name: 'Wall_아래벽', h: 300, texture: 'marble' },
            // 대형 창문
            { left: 80, top: 0, width: 250, height: 15, fill: '#81ecec', name: 'Window_메인창1', h: 200, elevation: 50, texture: 'glass' },
            { left: 400, top: 0, width: 200, height: 15, fill: '#81ecec', name: 'Window_메인창2', h: 180, elevation: 70, texture: 'glass' },
            { left: 680, top: 470, width: 15, height: 100, fill: '#5d4037', name: 'Door_현관', h: 240, texture: 'wood' },
            // 카페/상업 공간 구성
            { left: 40, top: 40, width: 200, height: 80, fill: '#4e342e', name: 'Cabinet_카운터', h: 110, texture: 'wood' },
            { left: 40, top: 140, width: 100, height: 60, fill: '#5d4037', name: 'Cabinet_진열장', h: 200, texture: 'glass' },
            // 좌석 구역
            { left: 300, top: 50, width: 120, height: 70, fill: '#fafafa', name: 'Table_테이블1', h: 75, texture: 'marble' },
            { left: 300, top: 130, width: 50, height: 50, fill: '#37474f', name: 'Chair_의자1', h: 85, texture: 'leather' },
            { left: 370, top: 130, width: 50, height: 50, fill: '#37474f', name: 'Chair_의자2', h: 85, texture: 'leather' },
            { left: 500, top: 50, width: 120, height: 70, fill: '#fafafa', name: 'Table_테이블2', h: 75, texture: 'marble' },
            { left: 500, top: 130, width: 50, height: 50, fill: '#37474f', name: 'Chair_의자3', h: 85, texture: 'leather' },
            { left: 570, top: 130, width: 50, height: 50, fill: '#37474f', name: 'Chair_의자4', h: 85, texture: 'leather' },
            // 라운지 구역
            { left: 300, top: 300, width: 250, height: 120, fill: '#455a64', name: 'Sofa_라운지소파', h: 80, texture: 'leather' },
            { left: 350, top: 440, width: 150, height: 90, fill: '#263238', name: 'Table_라운지테이블', h: 45, texture: 'marble' },
            // 조명
            { left: 350, top: 200, width: 40, height: 40, fill: '#ffd700', name: 'Lamp_샹들리에', h: 250, texture: 'metal' }
        ]
    },

    // ========== 실거주형 ==========
    // 특징: 1인 또는 커플용, 편안함, 생활 편의시설 완비, 워케이션 적합
    residential: {
        name: "홈라이프형",
        description: "실제 생활이 가능한 주거 공간입니다. 침실, 거실, 주방, 욕실 등 생활에 필요한 모든 시설이 갖춰져 있으며, 워케이션이나 세컨하우스로 활용하기 좋습니다.",
        features: ["🏠 완전한 주거 기능", "🛁 욕실/주방 포함", "🌿 편안한 휴식", "💼 워케이션 가능"],
        targetPyeong: "7~10평",
        estimatedCost: "3,000만원 ~ 5,000만원",
        roomSize: { width: 550, height: 500 },
        furniture: [
            // 벽면
            { left: 0, top: 0, width: 550, height: 15, fill: '#e8e8e8', name: 'Wall_뒤벽', h: 260, texture: 'color' },
            { left: 0, top: 15, width: 15, height: 485, fill: '#e8e8e8', name: 'Wall_왼벽', h: 260, texture: 'color' },
            { left: 535, top: 15, width: 15, height: 380, fill: '#e8e8e8', name: 'Wall_오른벽', h: 260, texture: 'color' },
            { left: 15, top: 485, width: 520, height: 15, fill: '#e8e8e8', name: 'Wall_아래벽', h: 260, texture: 'color' },
            // 내부 파티션 (욕실 구분)
            { left: 380, top: 15, width: 12, height: 180, fill: '#d0d0d0', name: 'Wall_욕실파티션', h: 260, texture: 'color' },
            { left: 380, top: 183, width: 155, height: 12, fill: '#d0d0d0', name: 'Wall_욕실파티션2', h: 260, texture: 'color' },
            // 창문 & 문
            { left: 100, top: 0, width: 150, height: 12, fill: '#81ecec', name: 'Window_거실창', h: 160, elevation: 60, texture: 'glass' },
            { left: 535, top: 395, width: 12, height: 80, fill: '#8d6e63', name: 'Door_현관', h: 210, texture: 'wood' },
            { left: 380, top: 15, width: 70, height: 10, fill: '#a0522d', name: 'Door_욕실문', h: 200, texture: 'wood' },
            // 침실 영역
            { left: 30, top: 30, width: 180, height: 200, fill: '#8B4513', name: 'Bed_퀸침대', h: 55, texture: 'wood' },
            { left: 220, top: 30, width: 60, height: 50, fill: '#a1887f', name: 'Table_협탁', h: 55, texture: 'wood' },
            { left: 220, top: 100, width: 130, height: 60, fill: '#bcaaa4', name: 'Cabinet_옷장', h: 200, texture: 'wood' },
            // 거실 영역
            { left: 30, top: 280, width: 180, height: 90, fill: '#78909c', name: 'Sofa_3인소파', h: 80, texture: 'fabric' },
            { left: 60, top: 380, width: 120, height: 70, fill: '#bcaaa4', name: 'Table_거실테이블', h: 45, texture: 'wood' },
            { left: 230, top: 280, width: 120, height: 50, fill: '#37474f', name: 'Cabinet_TV장', h: 50, texture: 'wood' },
            // 주방 영역
            { left: 230, top: 380, width: 120, height: 80, fill: '#546e7a', name: 'Kitchen_미니주방', h: 90, texture: 'metal' },
            // 욕실 영역
            { left: 400, top: 30, width: 120, height: 140, fill: '#b3e5fc', name: 'Bathroom_욕실', h: 100, texture: 'marble' },
            // 조명
            { left: 150, top: 250, width: 30, height: 30, fill: '#ffd700', name: 'Lamp_거실조명', h: 220, texture: 'metal' }
        ]
    },

    // ========== 간편스타터형 ==========
    // 특징: 로맨틱, 따뜻한 분위기, 2인 생활 최적화, 다이닝 공간
    newlywed: {
        name: "간편스타터형",
        description: "새로운 시작을 준비하는 커플을 위한 로맨틱하고 아늑한 공간입니다. 우드톤 중심의 따뜻한 인테리어와 2인 생활에 최적화된 동선이 특징입니다.",
        features: ["💕 로맨틱 분위기", "🪵 우드톤 인테리어", "🍽️ 다이닝 공간", "👫 2인 최적화"],
        targetPyeong: "8~12평",
        estimatedCost: "4,000만원 ~ 6,000만원",
        roomSize: { width: 650, height: 580 },
        furniture: [
            // 따뜻한 톤 벽면
            { left: 0, top: 0, width: 650, height: 18, fill: '#fff8e1', name: 'Wall_뒤벽', h: 270, texture: 'color' },
            { left: 0, top: 18, width: 18, height: 562, fill: '#fff8e1', name: 'Wall_왼벽', h: 270, texture: 'color' },
            { left: 632, top: 18, width: 18, height: 450, fill: '#fff8e1', name: 'Wall_오른벽', h: 270, texture: 'color' },
            { left: 18, top: 562, width: 614, height: 18, fill: '#fff8e1', name: 'Wall_아래벽', h: 270, texture: 'color' },
            // 내부 파티션
            { left: 400, top: 18, width: 12, height: 200, fill: '#ffe0b2', name: 'Wall_침실파티션', h: 270, texture: 'wood' },
            // 창문 & 문
            { left: 80, top: 0, width: 180, height: 14, fill: '#81ecec', name: 'Window_거실창', h: 180, elevation: 50, texture: 'glass' },
            { left: 450, top: 0, width: 140, height: 14, fill: '#81ecec', name: 'Window_침실창', h: 160, elevation: 70, texture: 'glass' },
            { left: 632, top: 468, width: 14, height: 90, fill: '#8d6e63', name: 'Door_현관', h: 220, texture: 'wood' },
            // 침실 영역 (킹사이즈)
            { left: 420, top: 40, width: 190, height: 220, fill: '#d4a373', name: 'Bed_킹침대', h: 60, texture: 'fabric' },
            { left: 420, top: 280, width: 80, height: 50, fill: '#e6ccb2', name: 'Table_화장대', h: 75, texture: 'wood' },
            { left: 520, top: 280, width: 90, height: 70, fill: '#c8b6a6', name: 'Cabinet_옷장', h: 220, texture: 'wood' },
            // 거실 영역
            { left: 40, top: 200, width: 220, height: 100, fill: '#faedcd', name: 'Sofa_커플소파', h: 85, texture: 'fabric' },
            { left: 90, top: 320, width: 130, height: 80, fill: '#d4a373', name: 'Table_거실테이블', h: 45, texture: 'wood' },
            { left: 40, top: 40, width: 220, height: 60, fill: '#c8b6a6', name: 'Cabinet_TV장', h: 55, texture: 'wood' },
            // 다이닝 영역
            { left: 40, top: 420, width: 140, height: 100, fill: '#e6ccb2', name: 'Table_다이닝테이블', h: 78, texture: 'wood' },
            { left: 60, top: 530, width: 45, height: 45, fill: '#a98467', name: 'Chair_다이닝1', h: 88, texture: 'wood' },
            { left: 115, top: 530, width: 45, height: 45, fill: '#a98467', name: 'Chair_다이닝2', h: 88, texture: 'wood' },
            // 미니 주방
            { left: 220, top: 420, width: 140, height: 100, fill: '#bcaaa4', name: 'Kitchen_주방', h: 90, texture: 'wood' },
            // 조명
            { left: 150, top: 130, width: 35, height: 35, fill: '#ffd54f', name: 'Lamp_거실조명', h: 230, texture: 'metal' },
            { left: 500, top: 150, width: 30, height: 30, fill: '#ffd54f', name: 'Lamp_침실조명', h: 230, texture: 'metal' }
        ]
    },

    // ========== 스마트워크형 ==========
    // 특징: 업무+생활 복합, 효율적 공간 활용, 모던 스타일, 홈오피스
    officetel: {
        name: "스마트워크형",
        description: "업무와 생활이 조화를 이루는 스마트한 복합 공간입니다. 모던한 디자인과 효율적인 동선으로 재택근무나 1인 사업에 최적화되어 있습니다.",
        features: ["💼 업무 공간 분리", "🖥️ 홈오피스 최적화", "⚡ 효율적 동선", "🔌 스마트 설비"],
        targetPyeong: "6~9평",
        estimatedCost: "3,500만원 ~ 5,500만원",
        roomSize: { width: 580, height: 520 },
        furniture: [
            // 모던 벽면
            { left: 0, top: 0, width: 580, height: 16, fill: '#f5f5f5', name: 'Wall_뒤벽', h: 260, texture: 'color' },
            { left: 0, top: 16, width: 16, height: 504, fill: '#f5f5f5', name: 'Wall_왼벽', h: 260, texture: 'color' },
            { left: 564, top: 16, width: 16, height: 400, fill: '#f5f5f5', name: 'Wall_오른벽', h: 260, texture: 'color' },
            { left: 16, top: 504, width: 548, height: 16, fill: '#f5f5f5', name: 'Wall_아래벽', h: 260, texture: 'color' },
            // 업무 공간 파티션 (유리)
            { left: 280, top: 16, width: 10, height: 220, fill: '#b0bec5', name: 'Wall_파티션', h: 180, texture: 'glass' },
            // 창문 & 문
            { left: 60, top: 0, width: 200, height: 14, fill: '#81ecec', name: 'Window_업무창', h: 180, elevation: 50, texture: 'glass' },
            { left: 350, top: 0, width: 150, height: 14, fill: '#81ecec', name: 'Window_생활창', h: 160, elevation: 70, texture: 'glass' },
            { left: 564, top: 416, width: 14, height: 80, fill: '#795548', name: 'Door_현관', h: 220, texture: 'wood' },
            // 업무 영역 (왼쪽)
            { left: 30, top: 30, width: 220, height: 90, fill: '#37474f', name: 'Desk_메인책상', h: 75, texture: 'wood' },
            { left: 30, top: 130, width: 80, height: 100, fill: '#455a64', name: 'Desk_보조책상', h: 75, texture: 'wood' },
            { left: 130, top: 140, width: 60, height: 60, fill: '#263238', name: 'Chair_오피스의자', h: 115, texture: 'leather' },
            { left: 30, top: 250, width: 120, height: 50, fill: '#546e7a', name: 'Bookshelf_책장', h: 200, texture: 'wood' },
            { left: 180, top: 250, width: 80, height: 50, fill: '#607d8b', name: 'Cabinet_서류장', h: 120, texture: 'metal' },
            // 생활 영역 (오른쪽)
            { left: 310, top: 30, width: 230, height: 180, fill: '#8d6e63', name: 'Bed_침대', h: 50, texture: 'fabric' },
            { left: 310, top: 230, width: 100, height: 50, fill: '#a1887f', name: 'Cabinet_미니옷장', h: 180, texture: 'wood' },
            // 공용 영역
            { left: 30, top: 340, width: 150, height: 80, fill: '#78909c', name: 'Sofa_소파', h: 75, texture: 'fabric' },
            { left: 200, top: 360, width: 100, height: 60, fill: '#90a4ae', name: 'Table_테이블', h: 45, texture: 'wood' },
            { left: 350, top: 320, width: 180, height: 80, fill: '#607d8b', name: 'Kitchen_주방', h: 90, texture: 'metal' },
            { left: 350, top: 420, width: 180, height: 70, fill: '#b3e5fc', name: 'Bathroom_미니욕실', h: 100, texture: 'marble' },
            // 조명
            { left: 130, top: 70, width: 25, height: 25, fill: '#ffffff', name: 'Lamp_데스크램프', h: 50, texture: 'metal' },
            { left: 400, top: 270, width: 30, height: 30, fill: '#ffd700', name: 'Lamp_생활조명', h: 220, texture: 'metal' }
        ]
    },

    // ========== 빈 공간 템플릿 ==========
    empty_small: {
        name: "빈 공간 (소형)",
        description: "3~4평 규모의 빈 공간입니다. 자유롭게 가구를 배치해보세요.",
        features: ["📐 소형 공간", "✨ 자유 배치"],
        targetPyeong: "3~4평",
        estimatedCost: "시공비만",
        roomSize: { width: 350, height: 320 },
        furniture: [
            { left: 0, top: 0, width: 350, height: 12, fill: '#e0e0e0', name: 'Wall_뒤벽', h: 240, texture: 'color' },
            { left: 0, top: 12, width: 12, height: 308, fill: '#e0e0e0', name: 'Wall_왼벽', h: 240, texture: 'color' },
            { left: 338, top: 12, width: 12, height: 220, fill: '#e0e0e0', name: 'Wall_오른벽', h: 240, texture: 'color' },
            { left: 12, top: 308, width: 326, height: 12, fill: '#e0e0e0', name: 'Wall_아래벽', h: 240, texture: 'color' },
            { left: 338, top: 232, width: 10, height: 76, fill: '#a0522d', name: 'Door_출입구', h: 210, texture: 'wood' }
        ]
    },
    empty_medium: {
        name: "빈 공간 (중형)",
        description: "6~8평 규모의 빈 공간입니다.",
        features: ["📐 중형 공간", "✨ 자유 배치"],
        targetPyeong: "6~8평",
        estimatedCost: "시공비만",
        roomSize: { width: 500, height: 450 },
        furniture: [
            { left: 0, top: 0, width: 500, height: 15, fill: '#e0e0e0', name: 'Wall_뒤벽', h: 250, texture: 'color' },
            { left: 0, top: 15, width: 15, height: 435, fill: '#e0e0e0', name: 'Wall_왼벽', h: 250, texture: 'color' },
            { left: 485, top: 15, width: 15, height: 350, fill: '#e0e0e0', name: 'Wall_오른벽', h: 250, texture: 'color' },
            { left: 15, top: 435, width: 470, height: 15, fill: '#e0e0e0', name: 'Wall_아래벽', h: 250, texture: 'color' },
            { left: 485, top: 365, width: 12, height: 70, fill: '#a0522d', name: 'Door_출입구', h: 210, texture: 'wood' }
        ]
    },
    empty_large: {
        name: "빈 공간 (대형)",
        description: "12~15평 규모의 넓은 공간입니다.",
        features: ["📐 대형 공간", "✨ 자유 배치"],
        targetPyeong: "12~15평",
        estimatedCost: "시공비만",
        roomSize: { width: 700, height: 650 },
        furniture: [
            { left: 0, top: 0, width: 700, height: 18, fill: '#e0e0e0', name: 'Wall_뒤벽', h: 280, texture: 'color' },
            { left: 0, top: 18, width: 18, height: 632, fill: '#e0e0e0', name: 'Wall_왼벽', h: 280, texture: 'color' },
            { left: 682, top: 18, width: 18, height: 520, fill: '#e0e0e0', name: 'Wall_오른벽', h: 280, texture: 'color' },
            { left: 18, top: 632, width: 664, height: 18, fill: '#e0e0e0', name: 'Wall_아래벽', h: 280, texture: 'color' },
            { left: 682, top: 538, width: 15, height: 94, fill: '#a0522d', name: 'Door_출입구', h: 220, texture: 'wood' }
        ]
    },

    // ========== 카페형 ==========
    // 특징: 소형 카페, 카운터+좌석, 따뜻한 우드톤
    cafe: {
        name: "카페형",
        description: "소형 카페 운영에 최적화된 공간입니다. 카운터, 좌석 배치, 진열장 등 카페 필수 요소가 갖춰져 있으며 따뜻한 우드톤 인테리어가 특징입니다.",
        features: ["☕ 카페 특화 설계", "🪑 좌석 배치 최적화", "🪵 우드톤 인테리어", "🍰 진열 공간 포함"],
        targetPyeong: "5~7평",
        estimatedCost: "2,500만원 ~ 4,000만원",
        roomSize: { width: 450, height: 400 },
        furniture: [
            // 벽면
            { left: 0, top: 0, width: 450, height: 15, fill: '#e8e0d4', name: 'Wall_뒤벽', h: 270, texture: 'color' },
            { left: 0, top: 15, width: 15, height: 385, fill: '#e8e0d4', name: 'Wall_왼벽', h: 270, texture: 'color' },
            { left: 435, top: 15, width: 15, height: 300, fill: '#e8e0d4', name: 'Wall_오른벽', h: 270, texture: 'color' },
            { left: 15, top: 385, width: 420, height: 15, fill: '#e8e0d4', name: 'Wall_아래벽', h: 270, texture: 'color' },
            // 전면 유리창
            { left: 60, top: 0, width: 200, height: 12, fill: '#81ecec', name: 'Window_전면창', h: 220, elevation: 0, texture: 'glass' },
            { left: 300, top: 0, width: 100, height: 12, fill: '#81ecec', name: 'Window_측면창', h: 160, elevation: 60, texture: 'glass' },
            // 출입구
            { left: 435, top: 315, width: 12, height: 70, fill: '#a0522d', name: 'Door_출입구', h: 220, texture: 'wood' },
            // 카운터 (ㄱ자형)
            { left: 25, top: 25, width: 200, height: 70, fill: '#4e342e', name: 'Cabinet_메인카운터', h: 110, texture: 'wood' },
            { left: 25, top: 95, width: 70, height: 100, fill: '#5d4037', name: 'Cabinet_사이드카운터', h: 110, texture: 'wood' },
            // 진열장
            { left: 25, top: 210, width: 70, height: 120, fill: '#6d4c41', name: 'Cabinet_진열장', h: 200, texture: 'glass' },
            // 2인 테이블 × 3
            { left: 200, top: 40, width: 90, height: 60, fill: '#d7ccc8', name: 'Table_창가테이블', h: 75, texture: 'wood' },
            { left: 320, top: 80, width: 90, height: 60, fill: '#d7ccc8', name: 'Table_벽쪽테이블', h: 75, texture: 'wood' },
            { left: 200, top: 180, width: 90, height: 60, fill: '#d7ccc8', name: 'Table_중앙테이블', h: 75, texture: 'wood' },
            // 의자 × 6 (테이블당 2개)
            { left: 210, top: 110, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_창가1', h: 85, texture: 'wood' },
            { left: 255, top: 110, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_창가2', h: 85, texture: 'wood' },
            { left: 330, top: 150, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_벽쪽1', h: 85, texture: 'wood' },
            { left: 375, top: 150, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_벽쪽2', h: 85, texture: 'wood' },
            { left: 210, top: 250, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_중앙1', h: 85, texture: 'wood' },
            { left: 255, top: 250, width: 35, height: 35, fill: '#8d6e63', name: 'Chair_중앙2', h: 85, texture: 'wood' },
            // 바 스툴 좌석 (카운터 앞)
            { left: 120, top: 100, width: 30, height: 30, fill: '#a1887f', name: 'Chair_바스툴1', h: 75, texture: 'wood' },
            { left: 160, top: 100, width: 30, height: 30, fill: '#a1887f', name: 'Chair_바스툴2', h: 75, texture: 'wood' },
            // 소파 (입구쪽 대기석)
            { left: 320, top: 300, width: 100, height: 60, fill: '#bcaaa4', name: 'Sofa_대기소파', h: 70, texture: 'fabric' },
            // 조명
            { left: 130, top: 55, width: 25, height: 25, fill: '#ffd54f', name: 'Lamp_카운터조명', h: 180, texture: 'metal' },
            { left: 240, top: 140, width: 25, height: 25, fill: '#ffd54f', name: 'Lamp_홀조명', h: 220, texture: 'metal' }
        ]
    }
};

// 성향 분석 결과와 템플릿 매핑
const PROPENSITY_TO_TEMPLATE = {
    '팝업창업형': 'shortterm',
    '안정정착형': 'longterm',
    '홈라이프형': 'residential',
    '간편스타터형': 'newlywed',
    '스마트워크형': 'officetel',
    '카페형': 'cafe'
};
