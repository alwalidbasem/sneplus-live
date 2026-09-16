CREATE TABLE IF NOT EXISTS comments (
    id              SERIAL PRIMARY KEY,
    live_session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    display_name    VARCHAR(120),
    message         VARCHAR(300) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_live_session ON comments(live_session_id, created_at DESC);
