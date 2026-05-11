# BloodConnect — High-Level Design

**Document type:** High-Level Design (HLD)
**Companion to:** `product-specification.md`, `low-level-design.md`
**Last updated:** 2026-05-11

---

## 1. Architectural overview

BloodConnect is a **single-tier Next.js application** with three logical layers:

1. **Presentation** — React Server Components (RSC) for initial render + Client Components for interactive surfaces.
2. **Application** — Next.js Route Handlers (`/api/**`) implementing the JSON API; Server Actions and server-rendered pages where appropriate.
3. **Data** — A managed Postgres database (Supabase project `pamulxgcgdkwzvfhlqjw`, used as a plain Postgres host) accessed via the `pg` client.

There is no separate backend service, no message broker, no background worker. Every read and every write happens inside a Next.js handler running on the server.

```
┌──────────────────────────────────────────────────────────────┐
│                          Browser                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Donor pages  │  │Hospital pages│  │ Admin pages  │        │
│  │ (RSC + RCC)  │  │ (RSC + RCC)  │  │ (RSC + RCC)  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────┬───────────────────┬──────────────────┬─────────────┘
           │  HTML on first hit │  fetch() JSON   │
           ▼                    ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js 16 application                       │
│                                                               │
│   src/proxy.ts  ── route guard (JWT cookie verify)           │
│                                                               │
│   ┌────────────────┐    ┌──────────────────────────────┐     │
│   │ Server Pages   │    │  Route Handlers (/api/**)    │     │
│   │  (RSC, async)  │    │  POST /api/auth/login        │     │
│   │  - dashboards  │    │  POST /api/donor/acceptances │     │
│   │  - admin view  │    │  PATCH /api/hospital/...     │     │
│   └────────┬───────┘    └──────────────┬───────────────┘     │
│            │                           │                       │
│            └───────────┬───────────────┘                       │
│                        │                                       │
│                        ▼                                       │
│              ┌──────────────────┐                              │
│              │  src/lib/db.ts   │ ── pg.Pool                  │
│              │  src/lib/jwt.ts  │ ── jose (HS256)             │
│              │  src/lib/session │ ── cookie → JWT payload      │
│              └────────┬─────────┘                              │
└───────────────────────┼───────────────────────────────────────┘
                        ▼
              ┌────────────────────┐
              │   Postgres (managed) │
              │   profiles            │
              │   blood_requests      │
              │   acceptances         │
              └────────────────────┘
```

---

## 2. Technology choices

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | One framework for SSR pages + JSON API; RSC for low-overhead reads; familiar to the team. |
| Language | **TypeScript 5** | Type safety across server + client; shared types between pages and handlers. |
| UI | **Tailwind CSS 4** + **shadcn/ui** primitives + custom components | Utility-first; small bundle; the entire visual system fits a single file. |
| Iconography | `lucide-react` | Clean, consistent SVG icons. |
| Auth | **Custom JWT in HttpOnly cookie** (`jose`) | No third-party SDK; full control over session shape; works seamlessly with RSC. |
| Password hashing | **bcryptjs** (10 rounds) | Industry default; pure JS so runs in Node runtime. |
| Database | **Postgres** (Supabase-hosted) via **`pg`** | Relational fits the domain (FKs everywhere); we don't use Supabase auth, RLS, or client libs — only the Postgres endpoint. |
| Fonts | `next/font/google` → Inter | Self-hosted, FOIT-safe. |
| Tooling | ESLint, TypeScript, Tailwind PostCSS | Standard Next.js defaults. |

> **Note on Next.js 16.** This is the current major. There are conventions different from earlier versions — most relevantly, route protection is implemented via `src/proxy.ts` (an exported `proxy` function with a `config.matcher`), not the deprecated `middleware.ts`. Before editing routing or rendering, read the relevant guide under `node_modules/next/dist/docs/`. See `AGENTS.md`.

---

## 3. Subsystem decomposition

### 3.1 Authentication subsystem

- **Sign-up** (`/api/auth/register`): validates the email is unused, hashes the password, inserts a `profiles` row, signs a JWT, sets a `token` cookie.
- **Sign-in** (`/api/auth/login`): looks up by email, bcrypt-compares, sets the cookie.
- **Sign-out** (`/api/auth/logout`): clears the cookie.
- **Session helper** (`src/lib/session.ts`): reads the cookie inside RSC pages and route handlers and returns the decoded payload (`{ id, role }`) or `null`.
- **Route guard** (`src/proxy.ts`): runs at the edge for `/donor/*`, `/hospital/*`, `/admin/*`, `/sign-in`, `/register`. Redirects unauthenticated traffic away from protected paths, and authenticated traffic away from auth pages.

There is no email verification today. There is no password reset flow.

### 3.2 Donor subsystem

- **Server page** (`/donor/dashboard`) hydrates the dashboard with four parallel queries (open matching requests, currently-accepted requests, attender-assigned requests, donation history).
- **Client component** (`DonorDashboardClient`) renders the dashboard, owns local state, and calls the donor API.
- **API endpoints:**
  - `GET /api/donor/profile` — read.
  - `GET /api/donor/requests` — open requests matching the donor's `(blood_group, city)`.
  - `PATCH /api/donor/availability` — toggle availability.
  - `POST /api/donor/acceptances` — accept a request (server enforces "one active acceptance").
  - `DELETE /api/donor/acceptances` — withdraw an `accepted` acceptance.

### 3.3 Hospital subsystem

- **Server page** (`/hospital/dashboard`) loads the hospital's own open requests, each with aggregated `acceptances` (`json_agg`) and the optional attender profile.
- **Form page** (`/hospital/blood-request`) is a plain client form that posts to `POST /api/hospital/requests`.
- **Client component** (`HospitalDashboardClient`) drives interactive state: filtering, search, donor lookup for attender, accept/reject modals.
- **API endpoints:**
  - `GET /api/hospital/profile`
  - `GET /api/hospital/requests` — own requests + acceptances.
  - `POST /api/hospital/requests` — create.
  - `PATCH /api/hospital/requests/[id]/acceptances` — transition a donor acceptance (donated / rejected, optional comment).
  - `PATCH /api/hospital/requests/[id]/attender` — assign / unassign attender.
  - `GET /api/hospital/donors?q=` — donor lookup by name or UUID.

### 3.4 Admin subsystem

- **Server page** (`/admin/dashboard`) runs four aggregate queries in parallel (donors per city/group, hospitals per city, open requests per city/group, completed-request count per city).
- **Client component** (`AdminDashboardClient`) renders the bar chart, city gap list, critical-request table, and recent-donations feed.
- Authorization is by exact email match against `ADMIN_EMAILS` env var. There is no `role = 'admin'` user in practice (though `profiles.role` does support the value); this is a deliberate simplification.

### 3.5 Cross-cutting concerns

- **Session** is read on every server-side render via `getSession()`.
- **Authorization** is enforced inside each handler — RLS is off. Every PATCH or DELETE that mutates someone else's data scopes the row by `hospital_id = $session.id` (or equivalent).
- **Notifications** are surfaced via in-app toasts (`src/components/shared/toast.tsx`) and are local to the page lifecycle.

---

## 4. Data architecture

Three tables, all in the `public` schema. Foreign keys cascade on delete.

```
┌────────────┐         ┌─────────────────┐         ┌──────────────┐
│ profiles   │1───────*│ blood_requests  │1───────*│ acceptances  │
│            │         │                 │         │              │
│ id (PK)    │         │ id (PK)         │         │ id (PK)      │
│ role       │         │ hospital_id (FK)│         │ request_id   │
│ email (UQ) │         │ blood_group     │         │ donor_id     │
│ ...        │         │ urgency_rank    │         │ status       │
│            │         │ attender_id (FK)│◄────┐   │ comment      │
└────────────┘         │ status          │     │   └──────────────┘
        ▲              │ patient_name    │     │
        │              └─────────────────┘     │
        └─────────────────────────────────────┘
                  (donor as attender)
```

Indexes (see `schema.sql`):
- `idx_blood_requests_blood_group_status (blood_group, status, urgency_rank)` — drives the donor feed query.
- `idx_blood_requests_hospital_id (hospital_id, status)` — drives the hospital dashboard.
- `idx_acceptances_donor_id` and `idx_acceptances_request_id` — both join paths on `acceptances`.
- `idx_profiles_email` — login lookup.
- `idx_blood_requests_attender_id` — attender lookups and uniqueness check.

There is no soft-delete and no archive table. Closed or stale requests stay in `blood_requests` and are filtered out by `status = 'open'`.

---

## 5. Key flows (sequence)

### 5.1 Donor accepts a request

```
Donor browser            /api/donor/acceptances        Postgres
     │  POST { request_id }    │                          │
     ├────────────────────────►│                          │
     │                         │ getSession() → donor_id  │
     │                         ├─────────────────────────►│
     │                         │ SELECT FROM acceptances  │
     │                         │  WHERE donor_id = $1     │
     │                         │  AND status='accepted'   │
     │                         │◄─────────────────────────│
     │                         │ if rows > 0 → 409        │
     │                         │ else                     │
     │                         ├─────────────────────────►│
     │                         │ INSERT INTO acceptances  │
     │                         │  ON CONFLICT UPDATE      │
     │                         │  status='accepted'       │
     │                         │◄─────────────────────────│
     │  200 { acceptance_id }  │                          │
     │◄────────────────────────│                          │
     │ (UI shifts request from │                          │
     │  Nearby → Upcoming)     │                          │
```

The "only one active acceptance" rule is enforced server-side, not via a DB constraint, because it depends on the row's *current* status. Race conditions are bounded by the connection's read-then-write window; under contention two near-simultaneous accepts could both pass the check. Acceptable for MVP — the failure mode is a hospital seeing two acceptances from the same donor, which is correctable on the dashboard.

### 5.2 Hospital marks a donor as donated

```
Hospital browser         /api/hospital/requests/[id]/acceptances        Postgres
     │ PATCH { acceptance_id, status, comment }                            │
     ├──────────────────────────►│                                         │
     │                            │ getSession() → hospital_id             │
     │                            ├──────────────────────────────────────►│
     │                            │ UPDATE acceptances a                   │
     │                            │   SET status, comment                  │
     │                            │ FROM blood_requests br                 │
     │                            │ WHERE a.id = $1                        │
     │                            │   AND a.request_id = br.id             │
     │                            │   AND br.hospital_id = $2  ← guard     │
     │                            │◄──────────────────────────────────────│
     │  200 { ok: true }          │                                         │
     │◄───────────────────────────│                                         │
```

The `hospital_id` join clause is the authorization check. Without it, any signed-in user could mutate any acceptance.

### 5.3 Donor dashboard load (RSC)

`/donor/dashboard/page.tsx` is an `async` server component. On request:

1. `getSession()` reads the cookie → `{ id, role }` or redirect.
2. Four `query()` calls run concurrently via `Promise.all`:
   - profile,
   - matching open requests,
   - currently-accepted requests,
   - attender-assigned requests.
3. A fifth query loads donation history.
4. The component returns `<DonorDashboardClient ... />` with all data as props. The client component takes over interactivity.

This is one round-trip from browser to server, but four concurrent queries inside the server — important to keep dashboard p50 < 1.5 s on cellular.

---

## 6. Deployment topology

```
┌───────────────────────────────┐
│  Vercel (or Node host)        │
│  - Next.js server runtime     │
│  - One region, no autoscale   │
│    needed for MVP             │
└───────────────┬───────────────┘
                │ TLS, sslmode=require
                ▼
┌───────────────────────────────┐
│  Supabase Postgres            │
│  pamulxgcgdkwzvfhlqjw         │
│  - public schema              │
│  - no RLS                     │
└───────────────────────────────┘
```

Environment variables (`.env.local`):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string used by `pg.Pool`. |
| `JWT_SECRET` | HS256 secret for `jose`. |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved for any client-side Supabase realtime channel. |

Local dev: `npm run dev` plus `npm run seed` to populate fixtures (`scripts/seed.js`).

---

## 7. Cross-cutting concerns

### 7.1 Security

- **Transport.** All traffic over TLS. SSL is enabled on the DB connection in production (`rejectUnauthorized: false` because Supabase uses a chained cert).
- **Authentication.** HttpOnly JWT cookie, 7-day expiry. `SameSite=Lax` on login (cross-site redirect from email confirmation is acceptable) and `SameSite=Strict` on register.
- **Authorization.** Enforced inside each route handler. RLS is intentionally off — every mutation joins or filters by `session.id`. The LLD lists each route's guard.
- **Password storage.** bcrypt at cost 10. No password complexity rules today.
- **Admin gate.** Email-allowlist via `ADMIN_EMAILS`. There is no in-DB admin flag.
- **Input validation.** Lightweight — request handlers trust the shape of JSON bodies and rely on Postgres `CHECK` constraints (`role`, `blood_group`, `urgency`, `urgency_rank`, `status`) for value-domain enforcement.

### 7.2 Observability

- `console.error` on caught exceptions in handlers (e.g. login). No structured logging today.
- No metrics, no traces, no error tracker (Sentry / equivalent) integrated.

### 7.3 Performance

- All hot-path queries are covered by indexes (see §4).
- Server pages use `Promise.all` to parallelize independent queries.
- Static assets and fonts are served by Next.js with default caching headers.
- Client bundles are kept lean — no chart library; the admin chart is rendered with raw divs / CSS bars.

### 7.4 Scalability

- The current architecture comfortably handles tens of thousands of donors and thousands of concurrent open requests. The bounded growth surfaces are:
  - `acceptances` row count (one per donor-request pair) — paged by `donor_id` index.
  - `blood_requests` filtered by `(blood_group, status)` — indexed.
- Beyond ~100k concurrent users we would need: connection pooling layer (pgBouncer), CDN for `/donor/dashboard` HTML shell, and explicit pagination on dashboards.

### 7.5 Theming

Light theme only. Dark mode is permanently out of scope (see Memory: user reverted dark/light toggle twice).

---

## 8. Risks and trade-offs

| Risk | Mitigation today | Future work |
|---|---|---|
| RLS off; a bug in a handler could expose another tenant's data | Code review of every handler; small surface (≈12 endpoints) | Add RLS as defence-in-depth once auth and roles stabilize |
| "One active acceptance" enforced in app, not DB | Acceptable for MVP volumes; race window is small | Add a partial unique index: `unique (donor_id) where status='accepted'` |
| Realtime feed depends on the browser tab being open | Toast on next page render is the fallback | Add SMS/WhatsApp notifications (Twilio or a regional gateway) |
| No identity verification | Email allowlist for hospitals; donor abuse is bounded because there is no monetary incentive | Aadhaar OTP for hospitals; phone-OTP for donors |
| Single region database | Acceptable latency for India; one DB to operate | Read replicas if dashboard p99 degrades |
| No backups / disaster recovery defined here | Supabase managed daily backups | Document RTO/RPO and test restore quarterly |

---

## 9. Glossary

- **Acceptance** — a donor's commitment to fulfill a hospital's request. Lifecycle: `pending → accepted → donated | rejected`.
- **Attender** — a donor designated as the on-the-ground coordinator for one patient's blood request. Sees all donors who accept that request.
- **Eligibility window** — the 90-day cooldown between a donor's last `donated` acceptance and their next allowed one.
- **Urgency rank** — integer 1 (critical), 2 (urgent), 3 (scheduled). Used to sort requests so critical floats to the top.
