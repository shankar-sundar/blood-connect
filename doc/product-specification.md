# BloodConnect — Product Specification

**Document type:** Product Specification (PRD)
**Product:** BloodConnect
**Status:** Built (MVP shipped, in active iteration)
**Owner:** Shankar
**Last updated:** 2026-05-11

---

## 1. Overview

BloodConnect is a web platform that connects voluntary blood donors with hospitals in India. Hospitals post blood requirements; donors in the same city with a matching blood group see those requests on a dashboard and can accept them. The hospital then coordinates collection and records the outcome. The product is optimized for the Indian context — city-scoped matching, mobile-first interaction, English UI, and a lightweight account model that does not require government ID up front.

The product is a single Next.js application (web responsive) with three user-facing roles — **Donor**, **Hospital**, and **Admin** — sharing one database.

---

## 2. Problem and motivation

In India, blood demand routinely outstrips voluntary supply. Hospitals rely on family-and-friends "replacement donation" loops; donors who *want* to help cannot easily discover when and where they are needed. Existing solutions fall into two buckets:

1. **Static donor registries** that go stale because there is no real-time signal of need.
2. **WhatsApp forwards** that surface need but with no structure, no verification, no record of outcome, and no way for a hospital to manage who is coming.

BloodConnect addresses both: a live request feed for donors and a structured queue with donor lifecycle states for hospitals.

---

## 3. Goals and non-goals

### Goals (MVP)
- Allow a verified hospital to post a blood requirement in under 60 seconds.
- Show a city- and blood-group-matched donor the request within seconds (realtime push).
- Allow a donor to accept exactly one open request at a time and track it through to donation.
- Let a hospital see all donors who accepted a request and progress each one through `pending → accepted → donated/rejected`.
- Support a **patient attender** workflow — a designated donor who helps coordinate other donors for a single patient.
- Give an admin a city-level view of supply/demand gaps and critical requests.

### Non-goals (deferred)
- Native mobile apps.
- Payments, paid donor incentives, or government compliance reporting.
- Cross-city / inter-state matching and logistics.
- Blood bank inventory tracking (units stored, expiry).
- Donor health screening, eligibility questionnaires, identity (Aadhaar) verification.
- Push notifications outside the open browser session (SMS, FCM, email).
- A WhatsApp or call-deflection integration.

---

## 4. Users and roles

| Role | Who they are | Primary need |
|---|---|---|
| **Donor** | An individual, 18–60, registered with their blood group and city | "Tell me when someone near me needs my blood group, and let me say yes in one tap." |
| **Hospital** | A registered hospital / blood bank in a city | "Post a need, see who responded, mark each donor as donated or rejected." |
| **Attender** | A donor who is also designated as the on-the-ground contact for one patient | "Help the patient's family by seeing every donor accepting against their request." |
| **Admin** | A platform operator | "Spot cities and blood groups where demand outstrips supply, and watch for stuck critical requests." |

A given user is one role at a time. The Attender capability is an overlay on top of a Donor account — the same person, with an additional view.

---

## 5. Core user journeys

### 5.1 Donor: register → match → donate

1. Donor signs up (`/register`) with name, email, password, mobile, blood group, gender, DOB, city.
2. After sign-in, they land on `/donor/dashboard` showing:
   - Their stats: blood group, lives saved (donations × 3), past donations, days until next eligibility.
   - An availability toggle (default on).
   - **Nearby Requests** — open requests in their city for their blood group, grouped by urgency (Critical / Urgent / Scheduled).
   - **Upcoming Donation** — the single request they have already accepted, if any.
   - **Assigned as Attender** — requests where they are the patient's attender (if any).
   - Donation history.
3. Donor taps **Accept** on a matching request. Rules:
   - Cannot accept if they have another active acceptance (must withdraw first).
   - Cannot accept if not currently eligible (within 90 days of last donation).
   - Cannot accept if availability toggle is off.
4. Acceptance is recorded with status `accepted`. The hospital sees them on their dashboard immediately.
5. The hospital later marks the acceptance as `donated` (success — a thank-you message is auto-saved) or `rejected` (with a reason).
6. The donor's donation history reflects the outcome. Eligibility countdown restarts on `donated`.

### 5.2 Hospital: post → triage → close

1. Hospital signs up with organization name, type, city, address, license number.
2. From `/hospital/dashboard`, they click **New blood request** → `/hospital/blood-request`.
3. Form captures: patient name, description, blood group (8 choices), urgency (critical / urgent / scheduled), units (1–20), component (whole blood, RBCs, platelets, FFP, cryo).
4. Submission creates an `open` `blood_requests` row. The request appears on their dashboard, sorted by urgency and recency.
5. As donors accept, each accepted donor appears under the request with status `accepted`. Hospital can:
   - Mark **Donated** (success — auto thank-you comment).
   - **Reject** with a reason (modal asks for a comment).
6. Searching and filtering on the dashboard: filter by request state buckets (pending, partial, fulfilled), free-text search by patient or description.
7. A request stays `open` until the hospital closes it or it is no longer needed. Closing is implicit — for now, the hospital simply ignores it. (Explicit close is a known gap.)

### 5.3 Patient attender

1. Hospital creates a non-scheduled request (critical or urgent).
2. Hospital searches for a donor by name or donor-ID and assigns them as the **attender** for that request.
3. A donor can be the attender on at most **one** active open request at a time.
4. The attender sees the request on their donor dashboard under **Assigned as Attender**, with the full list of donors who have accepted and each donor's status (pending / accepted / donated / rejected).
5. The attender uses this view to coordinate the donors offline (calls, transport, queueing).

### 5.4 Admin

1. Admin signs in with an email listed in the `ADMIN_EMAILS` env var.
2. `/admin/dashboard` shows:
   - **Supply vs. demand** — bar chart of available donors per blood group vs. open units required.
   - **City gaps** — cities where open requests outnumber available donors.
   - **Critical requests** — table of all open critical requests with age.
   - **Recent donations** — feed of completed donations across cities.
3. There are no destructive admin actions today (no manual close, no user suspension).

---

## 6. Functional requirements

### 6.1 Accounts
- Email + password auth; passwords stored as bcrypt hash.
- Session is a HTTP-only signed JWT cookie (`token`), 7-day expiry, HS256 (`jose`).
- Role-based route guarding via `src/proxy.ts`.
- Donor and Hospital share the same `profiles` table, distinguished by `role`.

### 6.2 Donor functionality
- Toggle availability.
- See requests filtered by `(blood_group, city)`.
- Accept exactly one request at a time (server-enforced).
- Withdraw an `accepted` acceptance (DELETE — only allowed in `accepted` state).
- See donation history.
- Compute and display badges: First Drop, 3/9/15/30 lives saved, Consistent Donor (≥3 donations).

### 6.3 Hospital functionality
- Create a blood request with required: patient_name, description, blood_group, urgency, units, component.
- View their own open requests with all acceptances aggregated.
- Per acceptance, transition `pending|accepted → donated` or `→ rejected` (with comment).
- Search donors by name (ILIKE) or by exact UUID.
- Assign / unassign an attender (non-scheduled requests only; one active attender per donor).
- Filter their dashboard by state buckets and free-text search.

### 6.4 Admin functionality
- Read-only city- and blood-group-level aggregates.
- Critical-request table with age.

### 6.5 Notifications
- In-app toast notifications via `src/components/shared/toast.tsx`.
- Realtime delivery is in scope per the project state (Supabase channels described in memory), but the current code persists data via direct Postgres (`pg` client) and uses page reloads / server-driven fetches. Realtime push, if present, is a layered enhancement — outside the contract of this spec.

---

## 7. Non-functional requirements

| Concern | Target |
|---|---|
| **Performance** | Dashboard load < 1.5 s on a typical 4G connection. All list queries are indexed (see `schema.sql`). |
| **Concurrency** | A donor can race to accept; the server enforces "only one active acceptance" before insert. `acceptances (request_id, donor_id)` has a unique constraint. |
| **Security** | Passwords bcrypt-hashed (10 rounds). JWT cookie is HttpOnly + SameSite=Lax (login) / Strict (register). Authorization is enforced in every API route handler (RLS is off). |
| **Reliability** | A single Postgres database. No queue, no background workers. All operations are synchronous request/response. |
| **Accessibility** | Color contrasts pass WCAG AA on the light theme. Form fields have labels and explicit `required` markers. |
| **Browser support** | Latest two versions of Chrome, Safari (mobile + desktop), Firefox, Edge. |
| **Localization** | English only. Dates rendered with `en-IN` locale. |
| **Theming** | Light theme only. Dark mode is explicitly out of scope — see Memory: "No dark mode toggle." |

---

## 8. Data model (summary)

Three tables; see `schema.sql` and the LLD for full definitions.

- `profiles` — one row per user, discriminated by `role` (`donor`, `hospital`, `admin`). Email is unique.
- `blood_requests` — one row per hospital ask. Has `status` (`open`, `closed`, `cancelled`), `urgency`, `urgency_rank`, `attender_id`, `patient_name`.
- `acceptances` — one row per donor responding to a request. Unique on `(request_id, donor_id)`. Status: `pending`, `accepted`, `donated`, `rejected`. Has `comment`.

---

## 9. Business rules

1. **One active acceptance per donor.** A donor with any `acceptances.status = 'accepted'` row cannot accept another request until they withdraw it or it terminates (`donated` / `rejected`).
2. **City + blood group exact match.** Donors see only `blood_requests` whose `blood_group` matches theirs and whose hospital's `city` matches theirs, case- and whitespace-insensitive.
3. **Eligibility.** A donor is eligible 90 days after their last `donated` acceptance. The UI blocks acceptance during the cooldown.
4. **Lives saved.** Each `donated` acceptance counts as 3 lives saved (1 unit can be split into 3 components).
5. **Attender uniqueness.** A donor can be attender on at most one `open` request at a time.
6. **Attender disallowed on scheduled requests.** Only critical and urgent requests may have an attender.
7. **Acceptance withdrawal.** A donor may DELETE their acceptance only while it is in `accepted` state. Once it is `donated` or `rejected`, it is immutable from the donor side.

---

## 10. Out of scope / known gaps

- No explicit "close" / "fulfilled" action on a `blood_requests` row by the hospital. (`status` column supports it, but no UI.)
- No SMS / WhatsApp / email notification rail. A donor must have the dashboard open to be alerted in realtime.
- No identity verification for donors or hospitals beyond email and self-declared license number.
- No multi-city or multi-tenant org model — a hospital is a single entity tied to one city.
- No admin moderation (user suspension, request deletion, attender override).
- No audit trail of who edited a request.
- No public, unauthenticated request feed.

---

## 11. Success metrics

| Metric | Definition | Target (90 days post-launch) |
|---|---|---|
| **Time to first responder** | Median time between `blood_requests.created_at` and first `acceptances.created_at` on the request | ≤ 10 minutes for critical, ≤ 30 minutes for urgent |
| **Fulfillment rate** | % of `open` requests that reach `donated` count ≥ `units` | ≥ 60% for critical |
| **Donor activation** | % of registered donors who have at least one `accepted` acceptance | ≥ 30% |
| **Donor retention** | % of donors with a second `donated` acceptance within 6 months | ≥ 15% |
| **Hospital activation** | % of registered hospitals that post ≥ 1 request in their first 14 days | ≥ 70% |

---

## 12. Release phases (historical)

The MVP shipped across five phases. They are listed here for context, not as forward plan:

1. **Auth & scaffold** — JWT cookie auth, register / sign-in, route guard.
2. **Dashboards** — donor and hospital dashboards.
3. **Realtime** — toast-driven notifications for new matching requests and new acceptances.
4. **Donor engagement** — lives-saved counter, eligibility cooldown, badges.
5. **Admin** — supply/demand and city-gap views.

Post-MVP increments shipped on the `pat-attender-workflow` branch:
- M001 — rename `notes` → `description` on requests.
- M002 — `pending` becomes a valid acceptance state (hospital must explicitly accept).
- M003 — `comment` field on acceptances (rejection reasons, thank-you).
- M004 — patient name and attender assignment on requests.
