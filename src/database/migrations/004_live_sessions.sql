CREATE TABLE IF NOT EXISTS live_sessions (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    host_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'live', 'paused', 'ended')),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    current_item_id INTEGER,
    viewer_peak     INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
