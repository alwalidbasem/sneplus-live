-- Paused auction clocks: while a live session is paused, the running
-- auction's remaining time is stored here (auction_ends_at is cleared and
-- restored on resume).
ALTER TABLE live_session_items
    ADD COLUMN IF NOT EXISTS auction_paused_remaining_ms INTEGER;