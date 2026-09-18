CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_lower_unique
    ON waitlist_entries (LOWER(email));
