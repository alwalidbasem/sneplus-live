CREATE TABLE IF NOT EXISTS waitlist_entries (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    country    VARCHAR(80)  NOT NULL,
    user_type  VARCHAR(20)  NOT NULL CHECK (user_type IN ('buyer', 'seller', 'creator')),
    category   VARCHAR(80)  NOT NULL,
    language   VARCHAR(8)   NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_type   ON waitlist_entries(user_type);
