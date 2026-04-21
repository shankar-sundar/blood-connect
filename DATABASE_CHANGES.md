# Database Changes

All schema changes to the Supabase project (`pamulxgcgdkwzvfhlqjw`).
Run each migration in the Supabase SQL editor in order.

---

## Baseline Schema (pre-existing, no migration needed)

Tables already present when this project started:

```sql
-- profiles
id uuid (FK → auth.users), role text, first_name text, last_name text,
org_name text, org_type text, mobile text, email text, blood_group text,
dob date, gender text, address text, license_no text, city text,
lat numeric, lng numeric, available boolean

-- blood_requests
id uuid, hospital_id uuid (FK → profiles), blood_group text, units int,
component text, urgency text, urgency_rank int, notes text, status text,
created_at timestamptz

-- acceptances
id uuid, request_id uuid (FK → blood_requests), donor_id uuid (FK → profiles),
status text, created_at timestamptz
```

---

## M001 — Rename `notes` to `description` on `blood_requests`

**Reason:** Field renamed in UI; description is now mandatory on new requests.

```sql
ALTER TABLE blood_requests RENAME COLUMN notes TO description;
```

**Applied:** pending  
**Affects:** `src/app/hospital/blood-request/page.tsx`, `src/components/hospital/dashboard-client.tsx`, `src/components/donor/dashboard-client.tsx`

---

## M002 — Add `pending` as valid acceptance status

**Reason:** Donor acceptance now creates a `pending` record; hospital must explicitly Accept or Reject before donation is confirmed. Previous default was `accepted`.

No column change needed (status is plain `text`). If a check constraint exists, update it:

```sql
-- Only run if a check constraint exists on acceptances.status
ALTER TABLE acceptances DROP CONSTRAINT IF EXISTS acceptances_status_check;
ALTER TABLE acceptances ADD CONSTRAINT acceptances_status_check
  CHECK (status IN ('pending', 'accepted', 'donated', 'rejected'));
```

**Applied:** pending  
**Affects:** `src/components/donor/dashboard-client.tsx` (insert), `src/components/hospital/dashboard-client.tsx` (display + update)

---

## M003 — Add `comment` column to `acceptances`

**Reason:** Hospital can leave a comment when rejecting a donor; a default thank-you message is auto-saved when marking a donation as completed.

```sql
ALTER TABLE acceptances ADD COLUMN IF NOT EXISTS comment text;
```

**Applied:** pending  
**Affects:** `src/app/api/hospital/requests/[id]/acceptances/route.ts`, `src/components/hospital/dashboard-client.tsx`
