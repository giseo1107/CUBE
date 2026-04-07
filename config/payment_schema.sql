-- KakaoPay 결제 관련 테이블
-- TiDB / MySQL 호환

CREATE TABLE IF NOT EXISTS orders (
    order_id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id           INT           NOT NULL,
    item_name         VARCHAR(255)  NOT NULL,
    total_amount      INT           NOT NULL,
    quantity          INT           NOT NULL DEFAULT 1,
    selected_options  TEXT,
    tid               VARCHAR(100),
    partner_order_id  VARCHAR(100),
    status            VARCHAR(20)   NOT NULL DEFAULT 'PAID',
    paid_at           DATETIME,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT       NOT NULL,
    tid                 VARCHAR(100) NOT NULL,
    payment_method_type VARCHAR(50),
    item_name           VARCHAR(255),
    total_amount        INT          NOT NULL,
    selected_options    TEXT,
    approved_at         DATETIME,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- 기존 테이블에 컬럼 추가 (이미 있으면 에러 무시)
-- ALTER TABLE payments ADD COLUMN IF NOT EXISTS selected_options TEXT;
