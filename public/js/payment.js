/**
 * KakaoPay 결제 프론트엔드 모듈
 * public/js/payment.js
 *
 * 사용법:
 *   requestKakaoPay({
 *     item_name:     '상품명',
 *     total_amount:  50000,
 *     quantity:      1,
 *     cart_ids:      [1, 2, 3],   // 장바구니 결제 시
 *     selected_options: '옵션:1000', // 바로구매 시
 *   });
 */

async function requestKakaoPay(orderData) {
    try {
        const res = await fetch('/api/payment/ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        const data = await res.json();

        if (!data.success) {
            alert('결제 준비에 실패했습니다: ' + (data.message || ''));
            return;
        }

        // 모바일/PC 분기
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const redirectUrl = isMobile ? data.next_redirect_mobile_url : data.next_redirect_pc_url;

        window.location.href = redirectUrl;

    } catch (err) {
        console.error('requestKakaoPay error:', err);
        alert('결제 요청 중 오류가 발생했습니다.');
    }
}
