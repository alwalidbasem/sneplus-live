# Sneplus Live

Live-commerce platform: live video-style sale rooms with **auctions** and **buy-now** products,
server-authoritative bidding, realtime updates via Socket.IO, and PostgreSQL persistence.

## Stack

- **Frontend:** HTML, CSS, Tailwind (CDN), jQuery, vanilla JS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL via the `pg` package (no ORM)
- **Realtime:** Socket.IO (rooms per live session: `live:<id>`)
- **Auth:** express-session + connect-pg-simple, bcrypt, HTTP-only cookies

## Getting started

1. Create the database:

   ```sql
   CREATE DATABASE sneplus_live;
   ```

2. Configure environment:

   ```bash
   cp .env.example .env   # then edit DB_*, SESSION_SECRET
   ```

3. Install, migrate, run:

   ```bash
   npm install
   npm run migrate
   npm run dev
   ```

4. Open <http://localhost:3000>

### Optional local demo data

Demo seeding creates test users, products, a scheduled live, and fake waitlist registrations. Do not run it against a production database or use seeded waitlist rows as demand metrics.

```bash
npm run seed:demo
```

The seed runner refuses to run in `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is explicitly set for a non-production demo database.

### Demo accounts after `npm run seed:demo`

| Email | Password | Role |
|---|---|---|
| admin@sneplus.live | Admin123! | admin |
| omar@ex.com | Buyer123! | host |
| ali@ex.com | Buyer123! | buyer |

## Architecture

```
Route -> Controller -> Service -> Model -> PostgreSQL
```

- **Routes** define endpoints + middleware only.
- **Controllers** handle HTTP request/response.
- **Services** contain business logic (auction engine, bidding, buy-now, live lifecycle).
- **Models** run parameterized SQL only.

## Simulation MVP

`/live` includes a frontend-only Live Commerce simulator for the validation MVP. It does not write bids, orders, or payments to PostgreSQL and does not require Socket.IO. The five built-in scenarios are Sneakers, iPhone, Watch, Branded Bag, and Mystery Product, each with configurable product timing, auction timing, bids, comments, viewer joins, viewer count updates, countdown, and optional MP4 host video URL.

Content Mode hides the internal control panel for mobile screen recording and automatically advances to the next configured product after the result animation. Manual continuation remains available for Admin/Host users outside Content Mode.

## Tests

```bash
npm test
```

The current automated tests cover deterministic simulation event ordering, pause/resume/restart, no duplicate execution after delayed ticks, and the required five scenario bid sequences. Database-backed waitlist/admin tests require a reachable PostgreSQL test database and are not yet wired into the default test command.

## Production Deployment Notes

1. Provision a Linux host with Node.js 20+ and PostgreSQL.
2. Create a least-privilege PostgreSQL user and database for the app.
3. Copy `.env.example` to `.env` and set `NODE_ENV=production`, database credentials, and a long random `SESSION_SECRET`.
4. If running behind Nginx or another HTTPS reverse proxy, set `TRUST_PROXY=1`.
5. Run:

   ```bash
   npm ci --omit=dev
   npm run migrate
   npm start
   ```

6. Serve the app behind HTTPS. Forward traffic to `PORT` and preserve `X-Forwarded-Proto`.
7. Do not run `npm run seed:demo` on the production database.

### Backup and Restore

```bash
pg_dump "$DATABASE_URL" > sneplus_live_$(date +%F).sql
psql "$DATABASE_URL" < sneplus_live_YYYY-MM-DD.sql
```

If you use separate `DB_*` variables instead of `DATABASE_URL`, pass the matching `-h`, `-U`, and database name flags to `pg_dump` and `psql`.

### External Inputs Needed

- Production PostgreSQL host, database, username, password, and backup location.
- HTTPS reverse proxy/domain details.
- Final official brand assets if different from the current in-repo Sneplus mark/colors.
- Any licensed host/demo MP4 assets. The repository must not include copyrighted commercial videos without permission.
- Osama's confirmation for Linux server access, environment variables, security policy, and backup schedule.
