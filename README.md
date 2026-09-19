# SNEPLUS LIVE - live commerce platform (auction + buy now)

Server-authoritative live commerce: live sessions, real-time bidding over
Socket.IO, Buy-Now purchases, waitlist, admin console and a local live
simulator used for demos.

## Stack

- Node.js + Express 4 (REST) + Socket.IO 4 (realtime)
- PostgreSQL (pg) - all persistent state; in-memory only for presence,
  auction timers and rate-limits (rebuilt/recovered on boot)
- express-session + connect-pg-simple (sessions stored in PostgreSQL)
- Frontend: static HTML + Tailwind (CDN) + jQuery, i18n (en/ar)

## Architecture

Route -> Controller -> Service -> Model -> PostgreSQL

- src/routes - URL wiring + auth/rate-limit middleware only
- src/controllers - input validation, response shaping
- src/services - business logic (auction engine, bidding, live state)
- src/models - SQL access, always parameterized
- src/sockets - Socket.IO handlers; identity comes from the shared
  express-session middleware, never from client payloads
- src/simulation - the demo timeline (shared by UI + tests, UMD module)

## Roles

- admin: everything a host can do + admin dashboard/products
- host: create live sessions, add items, start/pause/resume/end lives and auctions
- buyer: bid, buy-now, comment - own orders only

Authorization is always evaluated server-side (session role). The client
can never set its role (role in a register body is ignored) and socket
identity always comes from the server-side session.

## Live auction behavior (server-authoritative)

- The server decides: whether an auction is active, whether a bid is valid,
  the new price, the winner and the end state. Clients only display.
- Bidding runs inside a transaction that locks the item row (SELECT ... FOR
  UPDATE) and shares the live-session row (FOR SHARE), so pause/resume/end
  serialize against in-flight bids.
- Auction timers: one timer per item (Map), cleared on finalize/pause. A
  periodic recovery sweep re-finalizes anything a failed timer left behind.
  On boot, recoverActiveAuctions finalizes expired auctions and reschedules
  running ones - server restarts do not corrupt auction state.
- Pausing a live pauses the auction clock: the remaining time is stored in
  live_session_items.auction_paused_remaining_ms and restored on resume.
- Buy-Now marks the item sold and creates the order in the same transaction -
  double purchases are impossible (row lock + status check).

## Setup

npm install
cp .env.example .env    # then edit values
npm run migrate         # idempotent migrations
npm run seed:demo       # demo users/products/waitlist (blocked in production)
npm start               # http://localhost:3000

Demo credentials (seed): admin@sneplus.live / Admin123! (admin),
omar@ex.com / Buyer123! (host), ali@ex.com / Buyer123! (buyer).
Change them for anything beyond a local demo.

## Environment

All configuration lives in .env (see .env.example for placeholders):

- PORT: HTTP port (default 3000)
- NODE_ENV: development/production; anything but production relaxes rate
  limits and allows non-TLS session cookies (used by tests)
- TRUST_PROXY: set to 1 behind a reverse proxy so rate limiting sees real IPs
- DB_*: PostgreSQL connection
- SESSION_SECRET: required in production (server refuses to start without it)
- UPLOAD_DIR, MAX_UPLOAD_SIZE: product image uploads
- TEST_DB_NAME: optional; database used by integration tests (default <DB_NAME>_test)
- ALLOW_DEMO_SEED: must be true to seed demo data in production NODE_ENV

Never commit real secrets. .env is git-ignored.

## Database

- Migrations: npm run migrate (idempotent, run in filename order)
- Demo seed: npm run seed:demo
- Tables: users, waitlist_entries, products, live_sessions,
  live_session_items, bids, comments, orders, order_items, session

## Tests

npm test

node --test discovers and runs:

- tests/simulation.test.js - pure unit tests of the simulator timeline
  (delayed ticks, duplicate execution, pause/resume/restart)
- tests/db.auth.test.js - HTTP integration: registration (role escalation
  blocked), login/logout/session destruction, waitlist duplicates (including
  case-normalized uniqueness), admin-only endpoints, order scoping
- tests/db.auction.test.js - full auction lifecycle over HTTP + Socket.IO:
  unauthenticated bid rejection, validation, pause blocks bids + clock
  freeze/restore, concurrent bid serialization, exactly-once expiration,
  buy-now atomicity, duplicate finalization, server-restart recovery

DB tests automatically create a dedicated database (<DB_NAME>_test,
override with TEST_DB_NAME), run migrations + seed against it, and boot the
app on an ephemeral port. They need a reachable PostgreSQL server with the
credentials from .env / environment (see .env.test.example).

## Simulator (demo)

/live runs a client-side simulator (timeline in src/simulation, UI in
public/js/live/live.js). It is intentionally separate from the production
flow: it drives the demo experience (viewers, comments, bids, countdown,
hearts) locally in the browser and does NOT create live sessions, bids or
orders in PostgreSQL. Its timing behavior is covered by unit tests. The
production flow (REST /api/* + Socket.IO + PostgreSQL, server-authoritative)
is exercised end-to-end by the integration tests.

## Design system

Brand tokens live in two mirrored files: public/css/main.css (:root CSS
variables) and public/js/tailwind-config.js (Tailwind palette).

- Sneplus Red #CE0606 - brand + primary CTA (white text on CTA)
- Charcoal Black #111111 - primary text / dark backgrounds
- Soft Grey #E6E6E6 - secondary surfaces, price/accent text on dark
- Medium Grey #7A7A7A - secondary text on light surfaces
- Alert #B00020 - errors / rejections
- Deep Background #0B0B0F - dark sections
- Clean White #FFFFFF
- Derived dark-theme neutrals (documented): surface #18181B, surface2 #232327,
  muted #9C9C9C (Medium Grey lightened for WCAG AA on dark surfaces)
- Semantic success/live: #2ED573 (allowed non-brand success treatment)

Typography: Switzer/Satoshi/Montserrat headings (line-height 110-120%,
letter-spacing +2%), Inter body (line-height 140%, ~70ch measure), IBM Plex
Mono for official numerics; tabular numbers via font-variant-numeric on all
prices, IDs, timers and tables (.font-numeric / .tabular-nums).

## Security

- Helmet (CSP disabled because pages use the Tailwind CDN; do not enable CSP
  without bundling Tailwind locally)
- Rate limiting: global API, strict login limiter, waitlist limiter
- Parameterized SQL everywhere (no string interpolation of values)
- Server-side validation + sanitization of all user input
- Sessions: HttpOnly, SameSite=Lax, Secure in production, PG-backed store;
  logout destroys the server-side session row
- Uploads: MIME + extension whitelist, size limit, admin-only
- Central error handler never leaks SQL errors/stacks in production

## Production deployment

NODE_ENV=production SESSION_SECRET=<long random> TRUST_PROXY=1 npm start

- Run behind TLS (session cookies are Secure in production)
- Run migrations before first boot; auction recovery runs automatically at
  startup and a sweep keeps self-healing every 30s
- Backups: standard pg_dump of the database (the only durable state);
  storage/simulator-config.json and uploaded product images should be
  included in backups if used
