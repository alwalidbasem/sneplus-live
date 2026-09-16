CREATE TABLE IF NOT EXISTS live_session_items (
    id                    SERIAL PRIMARY KEY,
    live_session_id       INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    product_id            INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position              INTEGER NOT NULL DEFAULT 0,
    status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'active', 'sold', 'unsold', 'cancelled')),
    start_price           NUMERIC(12, 2),
    static_price          NUMERIC(12, 2),
    bid_duration_seconds  INTEGER,
    auction_started_at    TIMESTAMPTZ,
    auction_ends_at       TIMESTAMPTZ,
    winning_bid_id        INTEGER,
    winner_user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    final_price           NUMERIC(12, 2),
    started_at            TIMESTAMPTZ,
    ended_at              TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_items_session   ON live_session_items(live_session_id, position);
CREATE INDEX IF NOT EXISTS idx_live_items_status    ON live_session_items(status);
CREATE INDEX IF NOT EXISTS idx_live_items_auction_ends ON live_session_items(auction_ends_at) WHERE status = 'active';
