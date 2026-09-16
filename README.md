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

3. Install, migrate, seed, run:

   ```bash
   npm install
   npm run migrate
   npm run seed
   npm run dev
   ```

4. Open <http://localhost:3000>

### Demo accounts

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
