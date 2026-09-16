-- Sneplus Live demo seed
-- Users: admin@sneplus.live / Admin123!   |   ali@ex.com, sara@ex.com, omar@ex.com / Buyer123!

INSERT INTO users (name, email, password_hash, role) VALUES
    ('Sneplus Admin', 'admin@sneplus.live', '$2b$10$Z1a5l8Vzto/0d0.kvq8HrePYbb.gHOFgETQskivEHhcXwrgS0DyRe', 'admin'),
    ('Ali H.',        'ali@ex.com',         '$2b$10$q6ZMKekFh/jBXx2xjZvkB.hK6UNtVDsog7K/r//YqqWMiuTyjb6LG', 'buyer'),
    ('Sara M.',       'sara@ex.com',        '$2b$10$q6ZMKekFh/jBXx2xjZvkB.hK6UNtVDsog7K/r//YqqWMiuTyjb6LG', 'buyer'),
    ('Omar K.',       'omar@ex.com',        '$2b$10$q6ZMKekFh/jBXx2xjZvkB.hK6UNtVDsog7K/r//YqqWMiuTyjb6LG', 'host')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, category, icon, sale_type, start_price, static_price, bid_duration_seconds, created_by) VALUES
    ('Air Icon Runner', 'Limited edition runner, size 42.', 'Sneakers', '👟', 'auction', 50,  NULL, 30, 1),
    ('Gold Chrono',     'Classic gold chrono watch.',        'Watches',  '⌚', 'auction', 120, NULL, 45, 1),
    ('Phone X Pro',     'Latest flagship, 256GB.',           'Phones',   '📱', 'buy_now', NULL, 899, NULL, 1),
    ('Retro High Top',  '80s retro high top, size 40-45.',   'Sneakers', '👟', 'buy_now', NULL, 149, NULL, 1)
ON CONFLICT DO NOTHING;

INSERT INTO waitlist_entries (name, email, country, user_type, category, language, created_at) VALUES
    ('Ali H.',      'ali@ex.com',        'Jordan',               'buyer',   'Sneakers', 'ar', NOW() - INTERVAL '6 days'),
    ('Sara M.',     'sara@ex.com',       'United Arab Emirates', 'seller',  'Watches',  'en', NOW() - INTERVAL '6 days'),
    ('Omar K.',     'omar@ex.com',       'Saudi Arabia',         'buyer',   'Phones',   'ar', NOW() - INTERVAL '5 days'),
    ('Lina F.',     'lina@ex.com',       'Egypt',                'creator', 'Fashion',  'en', NOW() - INTERVAL '5 days'),
    ('Yousef B.',   'yousef@ex.com',     'Jordan',               'buyer',   'Sneakers', 'en', NOW() - INTERVAL '4 days'),
    ('Farah S.',    'farah@ex.com',      'Kuwait',               'buyer',   'Beauty',   'ar', NOW() - INTERVAL '4 days'),
    ('Khaled R.',   'khaled@ex.com',     'Jordan',               'seller',  'Sneakers', 'ar', NOW() - INTERVAL '3 days'),
    ('Dana A.',     'dana@ex.com',       'Qatar',                'buyer',   'Watches',  'en', NOW() - INTERVAL '3 days'),
    ('Mohammad T.', 'mohammad@ex.com',   'Saudi Arabia',         'creator', 'Phones',   'ar', NOW() - INTERVAL '2 days'),
    ('Nour Z.',     'nour@ex.com',       'United Arab Emirates', 'buyer',   'Fashion',  'en', NOW() - INTERVAL '2 days'),
    ('Hana Y.',     'hana@ex.com',       'Jordan',               'buyer',   'Sneakers', 'ar', NOW() - INTERVAL '1 day'),
    ('Tariq N.',    'tariq@ex.com',      'Egypt',                'seller',  'Beauty',   'en', NOW() - INTERVAL '1 day'),
    ('Rana P.',     'rana@ex.com',       'Jordan',               'buyer',   'Phones',   'ar', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO live_sessions (title, host_id, status) VALUES
    ('Sneplus Launch Drop', 4, 'scheduled')
ON CONFLICT DO NOTHING;

-- Add all demo products to the scheduled session
INSERT INTO live_session_items (live_session_id, product_id, position, start_price, static_price, bid_duration_seconds)
SELECT s.id, p.id, ROW_NUMBER() OVER (ORDER BY p.id), p.start_price, p.static_price, p.bid_duration_seconds
FROM live_sessions s
CROSS JOIN products p
WHERE s.title = 'Sneplus Launch Drop'
  AND NOT EXISTS (
      SELECT 1 FROM live_session_items i WHERE i.live_session_id = s.id AND i.product_id = p.id
  );
