# BloodConnect — Low-Level Design

**Document type:** Low-Level Design (LLD)
**Companion to:** `product-specification.md`, `high-level-design.md`
**Last updated:** 2026-05-11

This document is implementation-level: file layout, data schema, API contracts, state machines, and pseudocode for the non-trivial flows. Reading order — HLD first for context, then this for detail.

---

## 1. Source layout

```
src/
├── app/
│   ├── layout.tsx               Root layout — Inter font, html shell
│   ├── page.tsx                 Landing page (Apple-style dark hero)
│   ├── globals.css              Tailwind base + CSS variables
│   ├── favicon.ico
│   │
│   ├── sign-in/                 (page.tsx + form)
│   ├── register/                (page.tsx — donor + hospital tabs)
│   ├── check-email/             (page.tsx — post-signup confirmation)
│   ├── auth/callback/           (route.ts — PKCE exchange, vestigial)
│   │
│   ├── donor/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx   RSC; loads profile + 3 query bundle + history
│   │
│   ├── hospital/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx   RSC; loads profile + own open requests
│   │   └── blood-request/page.tsx   Client form to create a request
│   │
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx   RSC; admin gate + 4 aggregate queries
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        POST  { email, password } → cookie
│       │   ├── register/route.ts     POST  { role, ...fields } → cookie
│       │   └── logout/route.ts       POST                       → clear cookie
│       ├── donor/
│       │   ├── profile/route.ts      GET    own profile (subset)
│       │   ├── requests/route.ts     GET    matching open requests
│       │   ├── acceptances/route.ts  POST | DELETE  accept / withdraw
│       │   └── availability/route.ts PATCH  toggle available
│       └── hospital/
│           ├── profile/route.ts                 GET   own profile (subset)
│           ├── donors/route.ts                  GET   ?q= search by name or UUID
│           └── requests/
│               ├── route.ts                     GET | POST  list / create
│               └── [id]/
│                   ├── acceptances/route.ts     PATCH  transition acceptance
│                   └── attender/route.ts        PATCH  assign / unassign attender
│
├── components/
│   ├── donor/dashboard-client.tsx       Donor dashboard (client)
│   ├── hospital/dashboard-client.tsx    Hospital dashboard (client)
│   ├── admin/dashboard-client.tsx       Admin charts + tables
│   ├── shared/
│   │   ├── sidebar-layout.tsx           Shared sidebar shell
│   │   ├── top-nav.tsx                  Top nav (auth-aware)
│   │   ├── toast.tsx                    Toast notification
│   │   └── sign-out-button.tsx
│   └── ui/                              shadcn primitives
│
├── lib/
│   ├── db.ts                            pg.Pool + query() / queryOne()
│   ├── jwt.ts                           jose sign / verify, HS256
│   ├── session.ts                       Cookie → JWT payload
│   ├── donor-stats.ts                   livesSaved, eligibility, badges
│   ├── utils.ts                         clsx helpers
│   └── actions/                         (empty — server actions not used)
│
└── proxy.ts                             Edge route guard (replaces middleware.ts)
```

The two ancillary docs at the repo root are authoritative:
- `schema.sql` — full SQL to bootstrap a fresh database.
- `DATABASE_CHANGES.md` — chronological migrations (M001–M004 applied on this branch).

---

## 2. Database schema

### 2.1 `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `uuid_generate_v4()` default |
| `role` | `text` NOT NULL | check `in ('donor','hospital','admin')` |
| `password_hash` | `text` NOT NULL | bcrypt, cost 10 |
| `first_name` | `text` | donor only |
| `last_name` | `text` | donor only |
| `blood_group` | `text` | donor only; check `in ('A+','A-','B+','B-','O+','O-','AB+','AB-')` |
| `dob` | `date` | donor only |
| `gender` | `text` | donor only |
| `available` | `boolean` NOT NULL default `true` | donor only |
| `org_name` | `text` | hospital only |
| `org_type` | `text` | hospital only |
| `address` | `text` | hospital only |
| `license_no` | `text` | hospital only |
| `email` | `text` UNIQUE NOT NULL | login key |
| `mobile` | `text` | optional |
| `city` | `text` | match key for donor↔request |
| `lat` / `lng` | `numeric` | reserved for future geo |
| `created_at` | `timestamptz` NOT NULL default `now()` |

A row is either a donor row or a hospital row depending on `role`; the schema does not enforce this — the API does (different INSERT in `/api/auth/register`).

### 2.2 `blood_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK |
| `hospital_id` | `uuid` FK → `profiles(id)` ON DELETE CASCADE |
| `blood_group` | `text` NOT NULL | check (same 8 values) |
| `units` | `integer` NOT NULL | check `> 0` |
| `component` | `text` NOT NULL | free text, UI restricts to 5 values |
| `urgency` | `text` NOT NULL | check `in ('critical','urgent','scheduled')` |
| `urgency_rank` | `integer` NOT NULL | check `in (1,2,3)` |
| `description` | `text` NOT NULL | renamed from `notes` in M001 |
| `patient_name` | `text` | M004 |
| `attender_id` | `uuid` FK → `profiles(id)` | M004; nullable; donor-role only enforced in handler |
| `status` | `text` NOT NULL default `'open'` | check `in ('open','closed','cancelled')` |
| `created_at` | `timestamptz` NOT NULL default `now()` |

### 2.3 `acceptances`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK |
| `request_id` | `uuid` FK → `blood_requests(id)` ON DELETE CASCADE |
| `donor_id` | `uuid` FK → `profiles(id)` ON DELETE CASCADE |
| `status` | `text` NOT NULL default `'pending'` | check `in ('pending','accepted','donated','rejected')` (M002) |
| `comment` | `text` | M003 — rejection reason or auto thank-you |
| `created_at` | `timestamptz` NOT NULL default `now()` |
| | | UNIQUE `(request_id, donor_id)` |

### 2.4 Indexes

```sql
idx_blood_requests_blood_group_status   (blood_group, status, urgency_rank)
idx_blood_requests_hospital_id          (hospital_id, status)
idx_blood_requests_attender_id          (attender_id)
idx_acceptances_donor_id                (donor_id)
idx_acceptances_request_id              (request_id)
idx_profiles_email                      (email)
```

### 2.5 Migration history (relative to a hypothetical pre-existing schema)

| # | Change | Reason |
|---|---|---|
| M001 | `blood_requests.notes` → `description`; required on insert | UI rename + enforce content |
| M002 | Acceptance status set includes `pending` | Hospital must explicitly Accept before Donate |
| M003 | `acceptances.comment` added | Reject reasons; auto thank-you on donate |
| M004 | `blood_requests.patient_name`, `attender_id` added; index on attender | Patient-attender workflow |

---

## 3. Authentication & session

### 3.1 JWT (`src/lib/jwt.ts`)

```ts
type JWTPayload = { id: string; role: string }

signToken(payload): HS256, expires in 7d
verifyToken(token): returns payload | null (returns null on any error)
```

Secret: `process.env.JWT_SECRET`. There is no rotation mechanism.

### 3.2 Session (`src/lib/session.ts`)

```ts
async function getSession(): Promise<JWTPayload | null>
```

Reads the `token` cookie via `cookies()` from `next/headers` and verifies. Called from RSC pages and from route handlers.

### 3.3 Cookie attributes

| Field | Value |
|---|---|
| Name | `token` |
| `httpOnly` | true |
| `path` | `/` |
| `maxAge` | `60 * 60 * 24 * 7` (7 days) |
| `sameSite` | `lax` on login, `strict` on register |
| `secure` | implied in production (TLS) |

### 3.4 Route guard (`src/proxy.ts`)

```ts
PROTECTED   = ['/donor', '/hospital', '/admin']
AUTH_ROUTES = ['/sign-in', '/register']

proxy(req):
  token   = req.cookies.get('token')?.value
  session = token ? await verifyToken(token) : null
  if isProtected(req) && !session         -> redirect '/sign-in'
  if isAuth(req)      && session          -> redirect role-based dashboard
  else                                    -> NextResponse.next()

config.matcher = ['/donor/:path*', '/hospital/:path*', '/admin/:path*',
                  '/sign-in', '/register']
```

API handlers re-verify the session themselves via `getSession()`; the guard above is only for page navigations.

---

## 4. API contracts

All endpoints accept and return JSON. Errors are `{ error: string }` with appropriate status code. All handlers return `401` if `getSession()` is null.

### 4.1 Auth

#### `POST /api/auth/register`

Request:
```json
{
  "role": "donor" | "hospital",
  "email": "...",
  "password": "...",
  // donor extras: first_name, last_name, mobile, blood_group, city, lat?, lng?, dob, gender
  // hospital extras: org_name, org_type, mobile, address, city, license_no
}
```

Behavior:
1. `SELECT id FROM profiles WHERE email = $1` — return `400` if exists.
2. `bcrypt.hash(password, 10)`.
3. Two INSERT variants, one per role. `available = true` for donors.
4. Sign JWT, set cookie (SameSite=Strict), return `{ ok: true, role }`.

#### `POST /api/auth/login`

Request: `{ email, password }`. Returns `401` if email not found OR password mismatch. Otherwise sets cookie (SameSite=Lax), returns `{ role }`.

#### `POST /api/auth/logout`

Clears the cookie. Always returns `{ ok: true }`.

### 4.2 Donor

#### `GET /api/donor/profile`
Returns `{ id, first_name, last_name, blood_group, city, available }` of the session user.

#### `GET /api/donor/requests`
Returns open requests matching `(blood_group, city)`:

```sql
SELECT br.id, br.blood_group, br.units, br.component, br.urgency, br.urgency_rank,
       br.description, br.created_at,
       json_build_object('org_name', p.org_name, 'address', p.address, 'city', p.city) AS hospitals
FROM blood_requests br
JOIN profiles p ON p.id = br.hospital_id
WHERE br.status = 'open'
  AND br.blood_group = $1
  AND lower(trim(p.city)) = lower(trim($2))
ORDER BY br.urgency_rank ASC, br.created_at DESC
```

#### `PATCH /api/donor/availability`
Request: `{ available: boolean }`. Updates `profiles.available`.

#### `POST /api/donor/acceptances` — **the contended path**

Request: `{ request_id: uuid }`.

```sql
-- 1. precondition: no active acceptance
SELECT id FROM acceptances WHERE donor_id = $1 AND status = 'accepted';
-- if rows > 0 -> 409 "You already have an accepted request."

-- 2. insert (or upsert if a prior pending row exists)
INSERT INTO acceptances (request_id, donor_id, status)
VALUES ($1, $2, 'accepted')
ON CONFLICT (request_id, donor_id)
DO UPDATE SET status = EXCLUDED.status
RETURNING id;
```

Response: `{ ok: true, acceptance_id }`.

**Race window.** Step 1 is a SELECT and step 2 is an INSERT; nothing locks `acceptances` between them. Two simultaneous accepts from the same donor on two different requests could both pass step 1. The corrective action is manual (a hospital rejecting the duplicate). A tighter fix is a partial unique index:

```sql
CREATE UNIQUE INDEX uq_acceptances_one_active_per_donor
  ON acceptances(donor_id) WHERE status = 'accepted';
```

Not applied yet — listed as future work.

#### `DELETE /api/donor/acceptances`

Request: `{ acceptance_id }`.

```sql
DELETE FROM acceptances
WHERE id = $1 AND donor_id = $2 AND status = 'accepted';
```

Note the `status = 'accepted'` guard — a donor cannot delete a `donated` or `rejected` acceptance. Returns `{ ok: true }` regardless of rows affected.

### 4.3 Hospital

#### `GET /api/hospital/profile`
Returns `{ id, org_name, org_type, city }` of the session hospital.

#### `GET /api/hospital/requests`
Returns own open requests with all acceptances aggregated via `json_agg`:

```sql
SELECT br.*,
  coalesce(json_agg(
    json_build_object(
      'id', a.id,
      'status', a.status,
      'donor', json_build_object(
        'first_name', p.first_name, 'last_name', p.last_name, 'mobile', p.mobile)
    )) FILTER (WHERE a.id IS NOT NULL), '[]') AS acceptances
FROM blood_requests br
LEFT JOIN acceptances a ON a.request_id = br.id
LEFT JOIN profiles p ON p.id = a.donor_id
WHERE br.hospital_id = $1 AND br.status = 'open'
GROUP BY br.id
ORDER BY br.urgency_rank ASC, br.created_at DESC
```

#### `POST /api/hospital/requests`
Request: `{ blood_group, units, component, urgency, description, patient_name }`.
- `urgency_rank` derived from `urgency` (critical=1, urgent=2, scheduled=3).
- Inserts row with `status='open'`, returns `{ ok: true }`.

#### `GET /api/hospital/donors?q=`
Donor lookup. If `q` matches the UUID regex `/^[0-9a-f]{8}-...{12}$/i`, looks up by `id`. Otherwise ILIKE on `first_name`, `last_name`, or the concatenation, limit 10.

#### `PATCH /api/hospital/requests/[id]/acceptances`
Request: `{ acceptance_id, status, comment? }`. Status transitions:

```sql
UPDATE acceptances a
SET status = $1, comment = $2
FROM blood_requests br
WHERE a.id = $3
  AND a.request_id = br.id
  AND br.hospital_id = $4   -- authorization guard
```

The path parameter `[id]` is not used in the SQL — the join via `acceptance_id → request_id → hospital_id` is sufficient. The route signature still includes `[id]` for URL semantics.

#### `PATCH /api/hospital/requests/[id]/attender`
Request: `{ donor_id: uuid | null }`.

Algorithm:
1. Load the request: `SELECT urgency, hospital_id FROM blood_requests WHERE id=$1 AND status='open'`.
2. If not found or `hospital_id !== session.id` → `404`.
3. If `donor_id` is null → `UPDATE blood_requests SET attender_id = NULL` → return `{ ok: true }`.
4. If `request.urgency === 'scheduled'` → `400 "Cannot assign attender to scheduled requests"`.
5. Verify donor exists with `role = 'donor'` → `404` otherwise.
6. Check uniqueness: `SELECT id FROM blood_requests WHERE attender_id = $1 AND status='open' AND id != $2`. If a row exists → `409 "Donor is already an attender on another active request"`.
7. `UPDATE blood_requests SET attender_id = $1 WHERE id = $2`.

### 4.4 Admin

No dedicated API endpoints; `/admin/dashboard/page.tsx` executes four queries directly in RSC. See `app/admin/dashboard/page.tsx`.

---

## 5. State machines

### 5.1 `acceptances.status`

```
            ┌───────────┐
            │  (new)    │
            └─────┬─────┘
                  │ POST /api/donor/acceptances
                  ▼
            ┌───────────┐  PATCH (hospital, status='accepted')   ┌────────────┐
            │  pending  ├────────────────────────────────────────►│  accepted  │
            └─────┬─────┘                                         └──────┬─────┘
                  │ PATCH (rejected, comment)                            │
                  │                                                       │
                  ▼                                                       │
            ┌───────────┐                                                 │
            │ rejected  │                                                 │
            └───────────┘                                                 │
                  ▲                                                       │
                  │  PATCH (rejected, comment)                            │
                  └───────────────────────────────────────────────────────┤
                                                                          │
                                  PATCH (donated, default thanks)         │
                                          ┌───────────┐                   │
                                          │  donated  │◄──────────────────┘
                                          └───────────┘
            DELETE (donor) is allowed only from `accepted` state.
```

Notes:
- The current donor `POST` inserts directly as `accepted` (see `/api/donor/acceptances/route.ts`), so the `pending` state on the diagram exists in the schema (for cases where the hospital initiates the relationship) but is not reached by the donor-accept flow today.
- `donated` and `rejected` are terminal.

### 5.2 `blood_requests.status`

```
   ┌──────┐    (no UI today)    ┌────────┐
   │ open ├────────────────────►│ closed │
   └───┬──┘                     └────────┘
       │
       │ (no UI today)
       ▼
   ┌───────────┐
   │ cancelled │
   └───────────┘
```

`closed` and `cancelled` are valid in the column constraint but unreachable from the UI. Listed as a known gap.

---

## 6. Frontend module details

### 6.1 `DonorDashboardClient` (`src/components/donor/dashboard-client.tsx`)

State (`useState`):
- `profile`, `requests`, `acceptedRequests`, `attenderRequests`, `donations` — hydrated from props.
- `collapsedGroups: Set<string>` — collapse state per urgency group.
- `toasts: ToastMsg[]` — in-page notifications.
- `accepting`, `unaccepting` — id-keyed pending UI flags.
- `idCopied` — clipboard feedback.
- `attenderExpanded: string | null` — which attender card is open.

Key handlers:
- `toggleAvailability()` → `PATCH /api/donor/availability`.
- `acceptRequest(id)` → `POST /api/donor/acceptances`; on success moves the request from `requests` → `acceptedRequests`.
- `unacceptRequest(acceptanceId)` → `DELETE /api/donor/acceptances`; moves it back.
- Accept button is disabled when: `accepting === id` OR `!profile.available` OR `daysLeft > 0` OR another active acceptance exists.

Urgency groupings are computed inline (`grouped.critical | urgent | scheduled`).

### 6.2 `HospitalDashboardClient` (`src/components/hospital/dashboard-client.tsx`)

State includes the per-request donor-search subsystem for assigning an attender:

```ts
attenderSearch:    Record<requestId, query>
attenderResults:   Record<requestId, DonorResult[] | null>
attenderSearching: requestId | null
attenderAssigning: requestId | null
attenderDebounce:  Record<requestId, Timeout>   // 5-char auto-search debounce
```

Behavior: typing ≥5 characters into the attender search box triggers a debounced fetch to `GET /api/hospital/donors?q=`. Selecting a result POSTs to the attender route.

Acceptance actions:
- **Donated** — `updateAcceptance(id, 'donated', DONATED_COMMENT)`. The constant `DONATED_COMMENT` carries an auto thank-you.
- **Reject** — opens a modal asking for a reason, then `updateAcceptance(id, 'rejected', rejectComment.trim())`.

Filters and search are in-memory over the hydrated `requests` array.

> Implementation note in `dashboard-client.tsx`: the PATCH URL uses the placeholder segment `/api/hospital/requests/current/acceptances`. Since the handler ignores the path parameter and authorizes by joining via `hospital_id`, this works — but it is a misleading shape. Future cleanup: pass the real request id or drop the segment.

### 6.3 `AdminDashboardClient` (`src/components/admin/dashboard-client.tsx`)

Four aggregates rendered as plain CSS bar charts (no chart library):
- **Supply** — donors with `available = true` grouped by `blood_group`.
- **Demand** — sum of `units` on open requests grouped by `blood_group`.
- **City gaps** — cities where `open_requests > available_donors`.
- **Critical requests** — list with age in hours.

### 6.4 Toasts (`src/components/shared/toast.tsx`)

A toast is `{ id: number; message: string; type: 'success'|'info'|'warning' }`. Auto-dismiss after 5 s. Stacked top-right.

### 6.5 Sidebar layout (`src/components/shared/sidebar-layout.tsx`)

Apple-palette navigation: dark `#1d1d1f` text, light `#f5f5f7` surface, blue `#0071e3` accents. Light theme only. No theme provider.

---

## 7. Library helpers

### 7.1 `src/lib/db.ts`

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function query<T>(sql, params?): Promise<T[]>
async function queryOne<T>(sql, params?): Promise<T | null>
```

A single pool is reused across requests (module-level singleton — survives between handler invocations in Node).

### 7.2 `src/lib/donor-stats.ts`

```ts
livesSaved(donations):     count of 'donated' × 3
nextEligibleDate(donations): last 'donated' + 90 days (returns null if no donations)
daysUntilEligible(donations): ceil((next - now) / day), floored at 0
computeBadges(donations):  6 badges, see below
```

Badges:

| id | label | criterion |
|---|---|---|
| `first` | First Drop | count ≥ 1 |
| `hero3` | 3 Lives Saved | lives ≥ 3 |
| `hero9` | 9 Lives Saved | lives ≥ 9 |
| `hero15` | 15 Lives Saved | lives ≥ 15 |
| `streak3` | Consistent Donor | count ≥ 3 |
| `hero30` | City Hero | lives ≥ 30 |

> Note: `livesSaved` currently filters by `status === 'donated'`, but `nextEligibleDate` does *not* — it uses the most recent acceptance regardless of status. If a donor's last action was a `rejected`, the cooldown will still be applied. Minor bug; tracked as future work.

---

## 8. Concurrency, edge cases, and error handling

| Scenario | Behavior |
|---|---|
| Two donors accept the same critical request simultaneously | Both succeed; the hospital sees both and chooses. The request stays open until `donated` count ≥ `units`. |
| Donor accepts two requests in parallel tabs | Race window exists; one of the two will likely succeed twice. Mitigation: future partial unique index. |
| Hospital marks the same acceptance twice | Idempotent — UPDATE simply sets status again. |
| Withdraw after hospital already marked donated | DELETE has `AND status = 'accepted'`; affects 0 rows; returns `{ ok: true }`. |
| Assign an attender to a scheduled request | `400 "Cannot assign attender to scheduled requests"`. |
| Assign a donor who is already attender elsewhere | `409 "Donor is already an attender on another active request"`. |
| Donor is deleted from `profiles` | `ON DELETE CASCADE` removes their acceptances; `attender_id` becomes dangling (set null is NOT cascaded — known gap, may need explicit handling if user deletion is ever supported). |
| Hospital is deleted | Cascades through all their requests → all related acceptances. |
| JWT expired | Cookie still present; `verifyToken` returns null; user is redirected to `/sign-in`. |
| `JWT_SECRET` rotated | All existing cookies invalidated — users must sign in again. |

---

## 9. Validation summary

Validation is split between Postgres `CHECK` constraints (value domain) and route handlers (cross-row rules):

| Constraint | Layer | Mechanism |
|---|---|---|
| `role`, `blood_group`, `urgency`, `urgency_rank`, request `status`, acceptance `status` are in known sets | DB | `CHECK` |
| Email uniqueness | DB | `UNIQUE` |
| Acceptance uniqueness per (request, donor) | DB | `UNIQUE (request_id, donor_id)` |
| One active acceptance per donor | Handler | precondition SELECT |
| Attender allowed only on non-scheduled | Handler | check `urgency` |
| Attender uniqueness on active requests | Handler | precondition SELECT |
| Hospital owns the acceptance it edits | Handler | join on `hospital_id` |
| Eligibility cooldown | Client | disable Accept button when `daysLeft > 0` |

The client-side cooldown is **defence in depth, not authoritative**. A hand-crafted POST will currently succeed inside the cooldown. Server-side enforcement is a known gap.

---

## 10. Testing strategy (recommended)

There is no test suite today. When introduced, target the following surface in priority order:

1. **Authentication round-trip** — register → login → logout, cookie attributes.
2. **Acceptance state machine** — every legal transition; rejection of every illegal one.
3. **Attender rules** — scheduled-block, uniqueness, donor-role check.
4. **City + blood-group match** — case insensitivity, whitespace trimming.
5. **Eligibility cooldown** — server-side enforcement once added.
6. **Authorization scoping** — a hospital A cannot mutate hospital B's acceptances.

Suggested stack: Vitest for units, Playwright for end-to-end against a disposable Postgres (via `docker compose`).

---

## 11. Operational runbooks (skeletons)

- **Rotate `JWT_SECRET`.** Set new value in env, restart. All sessions invalidated.
- **Add admin.** Append email to `ADMIN_EMAILS` env var, restart.
- **Force-close a stuck request.** Currently requires a DB update: `UPDATE blood_requests SET status='closed' WHERE id=$1`. UI does not expose this.
- **Block abusive donor.** Currently no soft-block. Remove via `DELETE FROM profiles WHERE id=$1` — cascades through their acceptances. Use with care.
- **Seed data for staging.** `npm run seed` runs `scripts/seed.js` with `.env.local`.

---

## 12. Known gaps / backlog (from this LLD)

1. Server-side enforcement of the 90-day eligibility cooldown on `POST /api/donor/acceptances`.
2. Partial unique index for "one active acceptance per donor."
3. UI to close a request (`blood_requests.status = 'closed'`).
4. `nextEligibleDate` should filter by `status === 'donated'`.
5. Cleanup of `attender_id` when the assigned donor is deleted (set null on FK).
6. The PATCH URL `current` placeholder in `HospitalDashboardClient` should be replaced with the actual request id.
7. No tests. No structured logging. No error tracker.
8. No SMS / email rail; realtime delivery depends on the dashboard tab being open.
