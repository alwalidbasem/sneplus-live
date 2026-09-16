CREATE TABLE IF NOT EXISTS bids (
    id              SERIAL PRIMARY KEY,
    live_session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    live_item_id    INTEGER NOT NULL REFERENCES live_session_items(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_live_item_id     ON bids(live_item_id);
CREATE INDEX IF NOT EXISTS idx_bids_live_item_amount ON bids(live_item_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_user             ON bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_created          ON bids(created_at DESC);
