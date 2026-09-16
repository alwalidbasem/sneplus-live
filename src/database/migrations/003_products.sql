CREATE TABLE IF NOT EXISTS products (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(200) NOT NULL,
    description          TEXT,
    category             VARCHAR(80),
    image_url            TEXT,
    icon                 VARCHAR(8),
    sale_type            VARCHAR(20) NOT NULL CHECK (sale_type IN ('auction', 'buy_now')),
    start_price          NUMERIC(12, 2),
    static_price         NUMERIC(12, 2),
    bid_duration_seconds INTEGER CHECK (bid_duration_seconds IS NULL OR bid_duration_seconds BETWEEN 5 AND 3600),
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    created_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_type_price_check CHECK (
        (sale_type = 'auction'  AND start_price IS NOT NULL AND bid_duration_seconds IS NOT NULL)
        OR
        (sale_type = 'buy_now'  AND static_price IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
