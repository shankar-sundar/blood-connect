# BloodConnect — Product Specification
 
**Document type:** Product Specification (PRD)
**Product:** BloodConnect
**Status:** Built (MVP shipped, in active iteration)
**Owner:** Shankar
**Last updated:** <span style="color:#059669">2026-05-14 (updated post-customer-meetings with Rashtrotthana, Sankara, and Karunadu Rakta Sainikaru, May 7-8, 2026)</span>
 
---
 
## 1. Overview
 
BloodConnect is a web platform that connects voluntary blood donors with hospitals in India. Hospitals post blood requirements; donors in the same city with a matching blood group see those requests on a dashboard and can accept them. The hospital then coordinates collection and records the outcome. The product is optimized for the Indian context — city-scoped matching, mobile-first interaction, English UI, and a lightweight account model that does not require government ID up front.
 
The product is a single Next.js application (web responsive) with three user-facing roles — **Donor**, **Hospital**, and **Admin** — sharing one database.
 
<span style="color:#059669">**[NEW]** Two customer-discovery rounds in May 2026 — with **Rashtrotthana Blood Centre** (Vinod), **Sankara Hospital** technicians, and **Karunadu Rakta Sainikaru** (Vinod) — surfaced a substantial post-MVP requirements set. These are integrated below, scoped into release phases **M005–M014** in §12.</span>
 
---
 
## 2. Problem and motivation
 
In India, blood demand routinely outstrips voluntary supply. Hospitals rely on family-and-friends "replacement donation" loops; donors who *want* to help cannot easily discover when and where they are needed. Existing solutions fall into two buckets:
 
1. **Static donor registries** that go stale because there is no real-time signal of need.
2. **WhatsApp forwards** that surface need but with no structure, no verification, no record of outcome, and no way for a hospital to manage who is coming.
BloodConnect addresses both: a live request feed for donors and a structured queue with donor lifecycle states for hospitals.
 
<span style="color:#059669">**[NEW context from customer meetings, May 2026]:**</span>
 
- <span style="color:#059669">Camps yield ~6-7 donors/day across 7 days/week, totalling ~24,000 units/year per major partner. A single major Bengaluru blood bank issues ~23,660 units/year.</span>
- <span style="color:#059669">**Cold-call conversion is poor.** Blood banks routinely call 50-60 nearby donors for a specific need and only ~5-6 show up — a ~10% response rate. BloodConnect's filtered-broadcast approach aims to lift this materially.</span>
- <span style="color:#059669">**Donor experience at the collection point is a key churn driver.** Two specific failure modes called out: "the greeting isn't great" and "time per donation is too long" (~1.5-2 hours per donation vs. the ~30 min achievable target).</span>
- <span style="color:#059669">Thalassemia patient load is concentrated: ~500 active patients seen by a single major Bengaluru clinic, with ~25 in the active monthly transfusion pool. Critical for steady demand.</span>
- <span style="color:#059669">Informal "donors pay for blood" market is a persistent integrity problem in adjacent ecosystems. BloodConnect is and remains 100% voluntary; paid-donation requests are out of scope and flagged.</span>
- <span style="color:#059669">**Geographic scope (corrected):** Mainly Bengaluru and immediately surrounding districts. Pan-India remains out of scope, but adjacent-district coverage is now in scope (see §10).</span>
---
 
## 3. Goals and non-goals
 
### Goals (MVP)
- Allow a verified hospital to post a blood requirement in under 60 seconds.
- Show a city- and blood-group-matched donor the request within seconds (realtime push).
- Allow a donor to accept exactly one open request at a time and track it through to donation.
- Let a hospital see all donors who accepted a request and progress each one through `pending → accepted → donated/rejected`.
- Support a **patient attender** workflow — a designated donor who helps coordinate other donors for a single patient.
- Give an admin a city-level view of supply/demand gaps and critical requests.
<span style="color:#059669">**[NEW] Post-MVP goals (Phase M005+ — see §12):**</span>
 
- <span style="color:#059669">Capture donor donation preferences: frequency per year, preferred component type, preferred days/times.</span>
- <span style="color:#059669">Support hospital **"any compatible blood group"** emergency request type — donors matched per the ABO/Rh compatibility matrix rather than exact-group only.</span>
- <span style="color:#059669">Implement smart emergency broadcast: tier-1 cohort → radius expansion if no response within a tunable threshold.</span>
- <span style="color:#059669">Build a donor lifecycle engagement loop: thank-you on every donation, milestone congratulations at 10/25/50/100, social-media share cards, refer-a-friend.</span>
- <span style="color:#059669">Close the feedback loop: donor rates the hospital after every donation; hospital sees aggregate rating over time.</span>
- <span style="color:#059669">Surface hospital operational settings — per-day hours and per-component processing durations — to donors at acceptance time, and compute a per-donor **"show up by HH:MM"** time on every acceptance (see rule 19).</span>
- <span style="color:#059669">**Gate hospital activation behind a backend-team onboarding workflow** — a hospital cannot post requests until per-day hours and per-component processing durations are captured by a BloodConnect team member. Preserves data quality and unblocks accurate donor timing.</span>
- <span style="color:#059669">Add a **Group Leader** role for partner-org coordinators (Karunadu Rakta Sainikaru, Lions Club, Rotary, corporate CSR teams) with a dashboard for their members.</span>
- <span style="color:#059669">Add a **Blood Bank checklist** + a **donor guidelines page** (eligibility, cooldowns, what to expect).</span>
- <span style="color:#059669">Reduce per-donor camp time from 1.5-2 hours to ≤45 minutes through operational nudges and pre-screening.</span>
### Non-goals (deferred)
- Native mobile apps.
- Payments, paid donor incentives, or government compliance reporting.
- Cross-city / inter-state matching and logistics.
- Blood bank inventory tracking (units stored, expiry).
- Donor health screening, eligibility questionnaires, identity (Aadhaar) verification.
- Push notifications outside the open browser session (SMS, FCM, email).
- A WhatsApp or call-deflection integration.
<span style="color:#059669">**[STATUS UPDATE] Some non-goals are moving in-scope for M005+:** see §10.</span>
 
---
 
## 4. Users and roles
 
| Role | Who they are | Primary need |
|---|---|---|
| **Donor** | An individual, 18–60, registered with their blood group and city | "Tell me when someone near me needs my blood group, and let me say yes in one tap." |
| **Hospital** | A registered hospital / blood bank in a city | "Post a need, see who responded, mark each donor as donated or rejected." |
| **Attender** | A donor who is also designated as the on-the-ground contact for one patient | "Help the patient's family by seeing every donor accepting against their request." |
| **Admin** | A platform operator | "Spot cities and blood groups where demand outstrips supply, and watch for stuck critical requests." |
 
A given user is one role at a time. The Attender capability is an overlay on top of a Donor account — the same person, with an additional view.
 
<span style="color:#059669">**[NEW] Additional roles introduced post-MVP (M007, M010):**</span>
 
| Role | Who they are | Primary need |
|---|---|---|
| <span style="color:#059669">**Group leader**</span> | <span style="color:#059669">Coordinator from a partner org (Karunadu Rakta Sainikaru, Lions Club, Rotary, a corporate CSR rep)</span> | <span style="color:#059669">"Share the platform with my network. See which of my donors signed up and donated. Rally my members for emergencies."</span> |
| <span style="color:#059669">**Blood Bank staff**</span> | <span style="color:#059669">Licensed blood-bank operator distinct from a hospital admin (e.g., Rashtrotthana, Red Cross). Conceptually a sub-role under Hospital today.</span> | <span style="color:#059669">"Receive donor referrals from BloodConnect. Confirm timing windows. Run the checklist at collection time."</span> |
 
<span style="color:#059669">The Hospital role splits, operationally, into two sub-flows — hospital admin staff vs. blood-bank technicians at the collection point. Both share the Hospital account in the data model today; the platform exposes a different UI surface to each. See §6.3.</span>
 
---
 
## 5. Core user journeys
 
### 5.1 Donor: register → match → donate
 
1. Donor signs up (`/register`) with name, email, password, mobile, blood group, gender, DOB, city. <span style="color:#059669">**[NEW]** The form now includes a `confirm_password` field and a show-password toggle on both password fields (see §6.1).</span>
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
   <span style="color:#059669">**[NEW] Soft confirmation gate.** Before the acceptance is committed, the donor is shown a confirmation prompt — *"Are you sure? The hospital is counting on you to show up."* — with two options: [Yes, I'll be there] / [No, go back]. Only after the donor confirms is the acceptance written. Designed to catch accidental taps without adding meaningful friction for committed donors. On WhatsApp, this is a follow-up message with two quick-reply buttons (see §6.5).</span>
4. Acceptance is recorded with status `accepted`. The hospital sees them on their dashboard immediately. <span style="color:#059669">**[NEW]** The donor is shown an **arrival window** — `earliest_arrival` to `latest_arrival` — on the confirmation screen, computed from the hospital's hours (open, close, and lunch break) and processing duration per component (rule 19). If the day has a lunch break, two windows are shown. Reasoning is exposed inline — e.g., *"Sankara opens 9:00 AM, closes 1:00–2:00 PM for lunch, closes at 5:00 PM. SDP takes ~2.5 hours. Arrive 9:00 AM–11:30 AM or 2:00 PM–2:30 PM."* The arrival window is repeated in the post-acceptance WhatsApp follow-up (§6.5).</span>
<span style="color:#059669">**[NEW] Step 4a — Change-of-mind path (between acceptance and donation).** A donor who needs to back out has a tiered exit (see §6.2 and rule 7 for the full mechanic):
   - **Within 5 minutes** of accepting → one-tap **Cancel**. No reason captured; hospital not notified.
   - **More than 5 min after accepting, more than 1 hour before show-up time** → **Withdraw** with a reason from a dropdown. Hospital + attender are notified.
   - **Within 1 hour of show-up time, or already past it** → **Late withdrawal** with a mandatory reason + explanation. Hospital + attender get an immediate escalation; the slot is re-broadcast to next-best donors.
   All three flows are mirrored in the WhatsApp interaction (see §6.5). Friction scales with proximity to the donation moment — accidental taps stay cheap; late no-shows pay the most cost.</span>
5. The hospital later marks the acceptance as `donated` (success — a thank-you message is auto-saved) or `rejected` (with a reason).
6. The donor's donation history reflects the outcome. Eligibility countdown restarts on `donated`.
<span style="color:#059669">**[NEW] Additional donor-side steps (M005-M006, M011):**</span>
 
- <span style="color:#059669">**At registration (or any time after):** donor sets **donation preferences** — annual frequency (`2-4`, `5-8`, `as often as eligible`), preferred component (`whole blood`, `SDP`, `platelets`, `any`), and preferred days/times (matched against hospital availability).</span>
- <span style="color:#059669">**Step 7 — Thank-you message:** after `donated` is marked, donor automatically receives a thank-you message (in-app + WhatsApp).</span>
- <span style="color:#059669">**Step 8 — Milestones:** if the donation hits a milestone count (10 / 25 / 50 / 100), a congratulations message and a downloadable social-media card are generated.</span>
- <span style="color:#059669">**Step 9 — Hospital feedback:** ~24 hours after `donated`, donor is prompted with a single-question 1-5 star rating + optional comment about the hospital experience.</span>
- <span style="color:#059669">**Anytime — Donor profile page** (`/donor/[id]` or `/donor/profile`): public-facing summary with badges, lives saved, donation count, milestones, and a "refer a friend" CTA.</span>
- <span style="color:#059669">**Anytime — "Bring a friend":** donor can pre-register a guest who'll accompany them to a specific camp.</span>
- <span style="color:#059669">**Don't know your blood group:** donor may register without specifying a group; they're shown only "any compatible group" requests until they confirm their group at first donation.</span>
### 5.2 Hospital: post → triage → close
 
1. Hospital signs up with organization name, type, city, address, license number. <span style="color:#059669">**[NEW]** Form also captures admin email, password, and `confirm_password` with show-password toggles on both password fields (see §6.1).</span>
   <span style="color:#059669">**[NEW]** This now creates the profile in `pending_onboarding` status. A BloodConnect backend-team member then completes onboarding by capturing per-day operating hours and per-component processing durations (including checklist + screening time) — see §6.3, §6.4, and §8. Hospital cannot post requests until status moves to `active`. Self-serve sign-up is no longer terminal.</span>
2. From `/hospital/dashboard`, they click **New blood request** → `/hospital/blood-request`.
3. Form captures: patient name, description, blood group (8 choices), urgency (critical / urgent / scheduled), units (1–20), component (whole blood, RBCs, platelets, FFP, cryo).
4. Submission creates an `open` `blood_requests` row. The request appears on their dashboard, sorted by urgency and recency.
5. As donors accept, each accepted donor appears under the request with status `accepted`. Hospital can:
   - Mark **Donated** (success — auto thank-you comment).
   - **Reject** with a reason (modal asks for a comment).
6. Searching and filtering on the dashboard: filter by request state buckets (pending, partial, fulfilled), free-text search by patient or description.
7. A request stays `open` until the hospital closes it or it is no longer needed. Closing is implicit — for now, the hospital simply ignores it. (Explicit close is a known gap.)
<span style="color:#059669">**[NEW] Additional hospital-side capabilities (M005, M007):**</span>
 
- <span style="color:#059669">**"Any compatible group" toggle** on the New Request form — expands matching to all ABO/Rh-compatible donor groups. Used for critical / emergency cases.</span>
- <span style="color:#059669">**Hospital operating hours by day-of-week** (captured at onboarding by backend team, not self-edited): each weekday Mon-Sun has separate open/close times or is marked closed. These windows are surfaced to donors at acceptance time and gate acceptance per rule 12.</span>
- <span style="color:#059669">**Per-component processing durations** (also captured at onboarding): how long the hospital takes per component (whole blood, SDP, platelets, FFP, cryo, PRBC) from donor arrival to donor leaving — *includes* checklist + screening + actual procedure time. Used to compute the donor's "show up by" time on acceptance (rule 19).</span>
- <span style="color:#059669">**Delete attender auto-message** — explicit per-request action on the dashboard to revoke the platform-generated attender notification (for cases where the attender prefers offline coordination).</span>
- <span style="color:#059669">**Per-donor collection checklist** (Blood Bank sub-view) — at collection time, mark hemoglobin pass (≥12.5 g/dl), vein check pass, weight check (≥45 kg whole blood, ≥50 kg SDP), consent obtained. Persists on the `acceptances` row.</span>
- <span style="color:#059669">**Explicit close/fulfilled action** on a request — hospital can mark the request `fulfilled` once required units are donated, instead of leaving it implicit. (Was a known gap in MVP, now in scope M005.)</span>
- <span style="color:#059669">**Mark as fulfilled / cancelled** — hospital can also mark `cancelled` with a reason.</span>
### 5.3 Patient attender
 
1. Hospital creates a non-scheduled request (critical or urgent).
2. Hospital searches for a donor by name or donor-ID and assigns them as the **attender** for that request.
3. A donor can be the attender on at most **one** active open request at a time.
4. The attender sees the request on their donor dashboard under **Assigned as Attender**, with the full list of donors who have accepted and each donor's status (pending / accepted / donated / rejected).
5. The attender uses this view to coordinate the donors offline (calls, transport, queueing).
<span style="color:#059669">**[NEW]** Hospital staff may **delete the auto-generated attender notification message** at any time (M007).</span>
 
### 5.4 Admin
 
1. Admin signs in with an email listed in the `ADMIN_EMAILS` env var.
2. `/admin/dashboard` shows:
   - **Supply vs. demand** — bar chart of available donors per blood group vs. open units required.
   - **City gaps** — cities where open requests outnumber available donors.
   - **Critical requests** — table of all open critical requests with age.
   - **Recent donations** — feed of completed donations across cities.
3. There are no destructive admin actions today (no manual close, no user suspension).
<span style="color:#059669">**[NEW] Admin panel enhancements (M008):**</span>
 
- <span style="color:#059669">**Response-rate analytics** — per-city, per-blood-group, time-to-first-acceptance. Baseline target: lift cold-call response rate from ~10% to ≥25%.</span>
- <span style="color:#059669">**Hospital satisfaction score** — rolling 30-day average rating from donor feedback (1-5 stars), per hospital.</span>
- <span style="color:#059669">**Group leader analytics** — per partner org: members registered, donations completed, milestone counts.</span>
- <span style="color:#059669">**Operational alerts** — critical request unanswered > 15 min, urgent > 45 min; donor satisfaction score for a hospital drops below 3.5.</span>
- <span style="color:#059669">**Moderation actions (destructive):** suspend a donor, delete a request, reassign or remove an attender. All audit-logged.</span>
- <span style="color:#059669">**Emergency broadcast tuning panel:** set initial radius, expansion step, max donors per blast, per urgency.</span>
<span style="color:#059669">**[NEW] 5.5 Group leader: invite → onboard → track (M010)**</span>
 
1. <span style="color:#059669">A coordinator from a partner organization signs up via a special partner-onboarding link generated by an admin.</span>
2. <span style="color:#059669">They receive a unique referral link/code to share with their network.</span>
3. <span style="color:#059669">Donors who register via that link are permanently tagged with the group leader's affiliation (`profiles.group_leader_id`).</span>
4. <span style="color:#059669">The group leader's dashboard (`/group/[id]/dashboard`) shows aggregate stats for their group: members registered, donations completed, milestones hit, recent activity feed.</span>
5. <span style="color:#059669">Group leader can opt-in to receive notifications for emergency requests that match any of their members (so they can rally the group personally).</span>
---
 
## 6. Functional requirements
 
### 6.1 Accounts
- Email + password auth; passwords stored as bcrypt hash.
- Session is a HTTP-only signed JWT cookie (`token`), 7-day expiry, HS256 (`jose`).
- Role-based route guarding via `src/proxy.ts`.
- Donor and Hospital share the same `profiles` table, distinguished by `role`.
<span style="color:#059669">**[NEW] Registration form UX (both `/register` for donors and the hospital sign-up page):**</span>
 
- <span style="color:#059669">**Password confirmation field.** Registration forms include both `password` and `confirm_password` fields. Submission is blocked client-side and server-side if the two values do not match. Error messaging is inline and immediate (validates on blur, not just on submit).</span>
- <span style="color:#059669">**Show-password toggle.** Each password field (`password` and `confirm_password`) has an eye-icon toggle to reveal/hide the entered value. Default is hidden. Toggling reveals the value as plain text until the user toggles it back or leaves the field. Helps catch typos, which is the whole point of having a confirm field. Applies to registration only — login forms keep a single password field as today.</span>
- <span style="color:#059669">**Password minimum bar.** Same hash policy (bcrypt 10 rounds) — no change. Minimum length 8 characters; no other complexity rules at this stage. Server-side enforcement matches client.</span>
### 6.2 Donor functionality
- Toggle availability.
- See requests filtered by `(blood_group, city)`.
- Accept exactly one request at a time (server-enforced).
- ~~Withdraw an `accepted` acceptance (DELETE — only allowed in `accepted` state).~~ <span style="color:#059669">**[REVISED — replaced by tiered model below]**</span>
- <span style="color:#059669">**Soft confirmation on accept.** Before any acceptance is committed (web tap or WhatsApp button), the donor sees a confirmation prompt — "Are you sure? The hospital is counting on you." — with [Yes, I'll be there] / [No, go back]. Acceptance is only written after confirm. Web and WhatsApp parity required.</span>
- <span style="color:#059669">**Tier 1 — Easy cancel (≤5 min after acceptance).** A single-tap **Cancel** action. No reason captured. Acceptance row's status moves to `cancelled` (kept for audit) and the request is treated as un-accepted by matching — slot returns to the open pool. Hospital and attender are **not** notified. Available on `/donor/dashboard` and as a [Cancel] quick-reply on the WhatsApp acceptance confirmation.</span>
- <span style="color:#059669">**Tier 2 — Withdraw with reason (>5 min after accept, >1 hr before show-up time).** A **Withdraw** action that requires the donor to pick a reason from a dropdown — `emergency` / `health` / `schedule_conflict` / `mistake` / `other` — plus an optional free-text note. Acceptance status moves to `withdrawn`. Hospital + attender are notified via WhatsApp with the donor's stated reason; donor is also shown the attender's phone with a *"please call as a courtesy"* prompt (encouraged, not enforced). Matching engine re-broadcasts the slot.</span>
- <span style="color:#059669">**Tier 3 — Late withdrawal (≤1 hr before show-up, or already past show-up time).** Same reason dropdown, but the free-text explanation is **mandatory**. Acceptance status moves to `withdrawn_late`. Hospital + attender get an **immediate escalation** WhatsApp; the slot is auto-rebroadcast to next-best donors with urgency boosted by one level. Counted against the donor's reliability tracking (data captured; consequences TBD — see §12 open questions).</span>
- <span style="color:#059669">**Hospital-side "no-show" marker.** Distinct from donor-initiated withdrawal. If the donor neither shows up nor withdraws by show-up time + buffer, the hospital can mark the acceptance `no_show`. This disambiguates a silent ghost from a donor who at least informed the hospital. Late withdrawal is *preferable* to no-show — the platform's messaging makes this explicit to donors.</span>
- See donation history.
- Compute and display badges: First Drop, 3/9/15/30 lives saved, Consistent Donor (≥3 donations).
<span style="color:#059669">**[NEW] Donor functionality additions (M005, M006, M011):**</span>
 
- <span style="color:#059669">Set **donation frequency preference**: enum (`2-4`, `5-8`, `as often as eligible`).</span>
- <span style="color:#059669">Set **preferred donation type**: enum (`whole blood`, `SDP`, `platelets`, `any`). Matching prioritises accordingly.</span>
- <span style="color:#059669">Set **preferred donation days & times** — only see requests whose hospital is open during those windows (emergency requests bypass this filter).</span>
- <span style="color:#059669">**Donor profile page** — public URL, displaying badges, lives saved, donation count, optional photo + bio.</span>
- <span style="color:#059669">**Refer a friend** — share a referral link or deep-link via WhatsApp/SMS. Referrer is credited.</span>
- <span style="color:#059669">**"Bring a friend" registration** — pre-register a guest tied to a specific upcoming camp/request.</span>
- <span style="color:#059669">**Auto thank-you message** on each `donated` acceptance (in-app + WhatsApp).</span>
- <span style="color:#059669">**Milestone congratulations** at 10 / 25 / 50 / 100 donations, with a downloadable social-media card (square + portrait variants).</span>
- <span style="color:#059669">**Hospital feedback prompt** — 1-question 1-5 star rating + optional comment, ~24h after `donated`.</span>
- <span style="color:#059669">**Guidelines page** (`/donor/guidelines`) — eligibility criteria, cooldowns by component, weight/age requirements, what to expect at the camp, post-donation care.</span>
- <span style="color:#059669">**Register without blood group** — donor may sign up with "I don't know my blood group"; matched only to "any compatible group" requests until their group is confirmed at first donation.</span>
- <span style="color:#059669">**Arrival window on accepted requests** — donor sees an `earliest_arrival`–`latest_arrival` time pair on the confirmation screen, the dashboard, and the post-acceptance WhatsApp follow-up (§6.5). Computed per rule 19 from (a) the request's required-by deadline, (b) the hospital's open/close hours on the donation day, (c) the hospital's lunch/break window (if any), and (d) the hospital's processing duration for the requested component (which includes checklist + screening). If a lunch break splits the day into two valid windows, both are shown. Reasoning is exposed inline. The window recomputes if the donation slips to the next operating day.</span>
### 6.3 Hospital functionality
- Create a blood request with required: patient_name, description, blood_group, urgency, units, component.
- View their own open requests with all acceptances aggregated.
- Per acceptance, transition `pending|accepted → donated` or `→ rejected` (with comment).
- Search donors by name (ILIKE) or by exact UUID.
- Assign / unassign an attender (non-scheduled requests only; one active attender per donor).
- Filter their dashboard by state buckets and free-text search.
<span style="color:#059669">**[NEW] Hospital functionality additions (M005, M007):**</span>
 
- <span style="color:#059669">**Create request with "any compatible group"** — boolean flag on the New Request form. When true, matching expands to all ABO/Rh-compatible groups (rule 13).</span>
- <span style="color:#059669">**Hospital onboarding (backend-team workflow, gating activation):** A BloodConnect team member completes onboarding for every newly self-registered hospital. Required inputs:</span>
  - <span style="color:#059669">Per-day operating hours, Mon-Sun (each day independently open/close or closed-all-day).</span>
  - <span style="color:#059669">**Lunch / break window per day** (optional) — start and end time during which the hospital does not accept donors. Used by rule 19 to split the day into two arrival windows so donors aren't asked to arrive during the break.</span>
  - <span style="color:#059669">Per-component processing durations for every component the hospital supports — total elapsed time from donor arrival to donor leaving, *including* checklist + screening + procedure.</span>
  - <span style="color:#059669">List of components the hospital supports at all (a hospital may not collect SDP, for example).</span>
  - <span style="color:#059669">Primary on-site contact for donor coordination.</span>
  - <span style="color:#059669">Hospitals **cannot self-edit** these values after activation — to preserve data quality. Updates flow through an admin-support request (rule 22).</span>
- <span style="color:#059669">**Configure hospital activation status** — admin/backend role only. Transitions `pending_onboarding → active` when required data is captured; can revert to `suspended` for data-quality or moderation reasons.</span>
- <span style="color:#059669">**Mark request as `fulfilled` or `cancelled`** — explicit close action (no longer implicit).</span>
- <span style="color:#059669">**Delete attender auto-message** — per-request action.</span>
- <span style="color:#059669">**Per-donor collection checklist** (Blood Bank sub-view) — 4 boolean flags: hemoglobin pass, vein check pass, weight check pass, consent obtained. Required before `donated` can be marked.</span>
- <span style="color:#059669">**View donor preferred timing** alongside donor name on the dashboard for each acceptance.</span>
- <span style="color:#059669">**Hospital cordiality / training resources** — a "how to greet donors" guide accessible from the hospital settings page (PDF, downloadable).</span>
### 6.4 Admin functionality
- Read-only city- and blood-group-level aggregates.
- Critical-request table with age.
<span style="color:#059669">**[NEW] Admin functionality additions (M008 — operational scope; analytics/dashboards explicitly deferred):**</span>
 
- <span style="color:#059669">**Change-request inbox** — central queue of pending requests from hospitals and donors. Both groups submit change requests through their respective interfaces (rule 22 for hospitals; profile-edit flow for donors); admin reviews, approves, or rejects with an optional note. On approval, the platform applies the change directly to the target row (e.g., updates `hospital_hours` or a donor's blood group). Every action is audit-logged. Typical inbound:</span>
  - <span style="color:#059669">Hospital wants to update operating hours, lunch break, or per-component durations (rule 22 routes these here).</span>
  - <span style="color:#059669">Hospital wants to add/remove a supported component.</span>
  - <span style="color:#059669">Donor wants to change blood group after a clinical confirmation, fix an incorrect zip code, or update phone number.</span>
  - <span style="color:#059669">Donor wants to overturn an `acceptance_override` (e.g., re-open a `withdrawn` acceptance because they can make it after all). Edge case; reviewed manually.</span>
- <span style="color:#059669">**Moderation actions:** suspend a donor (with reason), delete a request, manually reassign or remove an attender. Audit-logged.</span>
- <span style="color:#059669">**Emergency broadcast tuning** — set N (initial cohort), R (initial radius), M (min responses), T (timeout), R' (expanded radius) per urgency level.</span>
- <span style="color:#059669">**Hospital onboarding workflow (backend team):**</span>
  - <span style="color:#059669">**Pending-onboarding queue** — list of all hospitals in `pending_onboarding` status with self-registration timestamp and stale-age indicator.</span>
  - <span style="color:#059669">**Onboarding form per hospital** — capture per-day open/close times (Mon-Sun) and lunch/break window if any, supported components, and per-component processing duration (donor arrival → leaving, includes checklist & screening).</span>
  - <span style="color:#059669">**Activate hospital** — button gated by required-fields validation (rule 21). Transitions status to `active` and unlocks request posting.</span>
  - <span style="color:#059669">**Edit operating hours / processing durations** for existing `active` hospitals — only admin/backend role; routed through the change-request inbox above; audit-logged.</span>
  - <span style="color:#059669">**Suspend hospital** — admin moderation action, audit-logged.</span>
<span style="color:#059669">**[DEFERRED] Admin analytics & dashboards** — the items below were originally scoped for M008 but are now deferred to a later phase (M015+). The data is captured today; the visualisations come later. Rationale: ship the operational primitives first (change-request inbox, moderation, onboarding); let real usage tell us which aggregates matter most:</span>
 
- <span style="color:#059669">~~Response-rate analytics — per-city, per-blood-group, per-urgency, time-to-first-acceptance.~~ **[Deferred]**</span>
- <span style="color:#059669">~~Hospital satisfaction score (rolling 30-day) — list view + per-hospital drill-in.~~ **[Deferred]**</span>
- <span style="color:#059669">~~Group-leader dashboard view — members per group, donations per group, engagement rate.~~ **[Deferred]**</span>
- <span style="color:#059669">~~Operational alert thresholds — critical > 15 min unanswered, urgent > 45 min unanswered, hospital satisfaction < 3.5 (configurable).~~ **[Deferred]**</span>
### 6.5 Notifications
- In-app toast notifications via `src/components/shared/toast.tsx`.
- Realtime delivery is in scope per the project state (Supabase channels described in memory), but the current code persists data via direct Postgres (`pg` client) and uses page reloads / server-driven fetches. Realtime push, if present, is a layered enhancement — outside the contract of this spec.
<span style="color:#059669">**[NEW] Notification additions (M005-M009, M012):**</span>
 
- <span style="color:#059669">**WhatsApp delivery rail** for all transactional notifications below (not just in-app toast).</span>
- <span style="color:#059669">**Thank-you message** — auto-sent on `donated` status transition.</span>
- <span style="color:#059669">**Milestone messages** — auto-sent at 10 / 25 / 50 / 100 donation counts.</span>
- <span style="color:#059669">**Post-acceptance follow-up message** — sent immediately after the donor passes the soft-confirmation gate. Delivered on the same channel as the acceptance (in-app + WhatsApp). Contents:</span>
  - <span style="color:#059669">**Arrival window** — `earliest_arrival` and `latest_arrival` (per rule 19), with lunch/break called out explicitly if present. Example: *"Sankara Hospital, today. Please arrive between **9:00 AM and 11:30 AM**, or between **2:00 PM and 2:30 PM**. The hospital is closed for lunch 1:00–2:00 PM. SDP donation takes ~2.5 hours including checklist & screening."*</span>
  - <span style="color:#059669">Hospital address and how to find the donation centre on arrival.</span>
  - <span style="color:#059669">Attender's name and phone (so the donor can call to coordinate).</span>
  - <span style="color:#059669">Pre-donation prep tips — eat well, hydrate, bring ID — link to the donor guidelines page.</span>
  - <span style="color:#059669">Cancel / withdraw controls (per §6.2 tiered model and the WhatsApp flow below).</span>
- <span style="color:#059669">**Hospital timing reminder** — sent to a donor on the morning of their accepted donation. Repeats the **arrival window** from the follow-up message but with today's actual hours (in case anything changed). Example: *"Reminder: Sankara Hospital today. Arrive **9 AM–11:30 AM or 2:00 PM–2:30 PM** (lunch break 1–2 PM). Your SDP slot takes ~2.5 hours."*</span>
- <span style="color:#059669">**Personal outreach** — Blood-bank/Hospital staff (e.g., Sankara technicians) can send a personal message to a specific donor in their pool via the platform's notification rail. Logged.</span>
- <span style="color:#059669">**Emergency broadcast** — tiered: initial blast to N donors within R km. If <M acceptances in T minutes, expand to R' km and re-broadcast. Defaults (tunable per urgency): N=20, R=5 km, M=2, T=10 min, R'=10 km. Critical urgency may bypass cohort-size cap.</span>
- <span style="color:#059669">**Donor feedback prompt** — sent ~24h after `donated` status.</span>
- <span style="color:#059669">**Refer-a-friend** — invite link sent via WhatsApp or SMS.</span>
- <span style="color:#059669">**WhatsApp accept → cancel → withdraw flow.** Mirrors the tiered model in §6.2:</span>
  - <span style="color:#059669">**Soft confirm:** when donor taps [Accept] on the original WhatsApp request, the platform sends a follow-up message — "Are you sure? Hospital is counting on you." — with quick replies [Yes, I'll be there] / [No, go back]. Acceptance commits only after [Yes, I'll be there].</span>
  - <span style="color:#059669">**Tier 1 window (0-5 min):** the post-confirm WhatsApp message includes a [Cancel] quick-reply. Tapping it deletes the acceptance silently. Button auto-expires after 5 minutes.</span>
  - <span style="color:#059669">**Tier 2 / Tier 3 window (>5 min after accept):** the message updates (or a follow-up nudge is sent) replacing [Cancel] with [Need to withdraw?]. Tapping opens a WhatsApp list message with reason options — `emergency` / `health` / `schedule conflict` / `mistake` / `other`. Selection triggers a follow-up message asking for a free-text note (optional in Tier 2, **mandatory in Tier 3**).</span>
  - <span style="color:#059669">**Hospital + attender notification:** on Tier 2/3 confirm, both parties receive a WhatsApp message with the donor's reason and (Tier 3 only) an escalation flag. The attender's number is also returned to the donor with a "please call to coordinate" line.</span>
  - <span style="color:#059669">**Late-withdrawal escalation:** Tier 3 also triggers an auto-rebroadcast WhatsApp blast to next-best donors with urgency bumped one level (per rule 14).</span>
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
 
<span style="color:#059669">**[NEW] Additional non-functional concerns (M005+):**</span>
 
| <span style="color:#059669">Concern</span> | <span style="color:#059669">Target</span> |
|---|---|
| <span style="color:#059669">**Notification latency**</span> | <span style="color:#059669">WhatsApp message delivered ≤ 30 seconds from trigger event. Emergency broadcast ≤ 10 seconds.</span> |
| <span style="color:#059669">**Camp-time efficiency**</span> | <span style="color:#059669">Median donor time at collection point (arrival → leaving) ≤ 45 min, down from current 90-120 min baseline.</span> |
| <span style="color:#059669">**Background workers**</span> | <span style="color:#059669">Notifications, milestone calc, feedback-prompt scheduling, and emergency-broadcast escalation run via a scheduled job/queue (architectural change from MVP's pure-sync model).</span> |
 
---
 
## 8. Data model (summary)
 
Three tables; see `schema.sql` and the LLD for full definitions.
 
- `profiles` — one row per user, discriminated by `role` (`donor`, `hospital`, `admin`). Email is unique.
- `blood_requests` — one row per hospital ask. Has `status` (`open`, `closed`, `cancelled`), `urgency`, `urgency_rank`, `attender_id`, `patient_name`.
- `acceptances` — one row per donor responding to a request. Unique on `(request_id, donor_id)`. Status: `pending`, `accepted`, `donated`, `rejected`. Has `comment`.
<span style="color:#059669">**[NEW] Schema additions for M005+:**</span>
 
- <span style="color:#059669">`profiles`: add `preferred_donation_frequency` (enum), `preferred_donation_type` (enum), `preferred_days` (text[] of day names), `preferred_start_time` / `preferred_end_time` (time), `group_leader_id` (FK to profiles, nullable), `referred_by` (FK to profiles, nullable), `weight_kg` (numeric, nullable), `sex` (enum: M/F/Other), `dob` (already present — used for age/eligibility).</span>
- <span style="color:#059669">`profiles.role`: add new value `group_leader`.</span>
- <span style="color:#059669">`blood_requests`: add `accept_any_compatible_group` (bool, default false), `fulfilled_at` (timestamptz, nullable), `cancellation_reason` (text, nullable).</span>
- <span style="color:#059669">`acceptances`: add `donor_feedback_rating` (int 1-5, nullable), `donor_feedback_comment` (text, nullable), `checklist_hemoglobin_pass` (bool, nullable), `checklist_vein_check_pass` (bool, nullable), `checklist_weight_pass` (bool, nullable), `checklist_consent` (bool, nullable).</span>
- <span style="color:#059669">`acceptances.status` enum: **extend** with `cancelled`, `withdrawn`, `withdrawn_late`, and `no_show`. The current values (`pending`, `accepted`, `donated`, `rejected`) remain. The four new values represent the donor-side exit states (rules 7a-7c) and the hospital-side no-show marker. Per rule 7, `donated` and `rejected` remain terminal.</span>
- <span style="color:#059669">`acceptances`: add `confirmed_at` (timestamptz, nullable) — set when donor passes the soft-confirm gate; null until then. `withdrawn_at` (timestamptz, nullable). `withdrawal_reason` (enum: `emergency` / `health` / `schedule_conflict` / `mistake` / `other`, nullable). `withdrawal_note` (text, nullable — required when status = `withdrawn_late`, optional when `withdrawn`).</span>
- <span style="color:#059669">~~New table `hospital_settings`: `hospital_id` (FK, PK), `donation_days` (text[]), `donation_start_time` (time), `donation_end_time` (time), `attender_auto_message_enabled` (bool, default true), `updated_at`.~~ **[REVISED]** Replaced by the three tables below — a single row of hours is insufficient because hospitals open different hours on different days, and processing time depends on the component.</span>
- <span style="color:#059669">New table `hospital_settings` (now only non-schedule settings): `hospital_id` (FK, PK), `attender_auto_message_enabled` (bool, default true), `primary_donor_contact_name` (text), `primary_donor_contact_phone` (text), `updated_at`.</span>
- <span style="color:#059669">New table `hospital_hours`: composite PK (`hospital_id`, `day_of_week`); `day_of_week` (enum: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`); `open_time` (time, nullable — null means closed); `close_time` (time, nullable); `lunch_start_time` (time, nullable); `lunch_end_time` (time, nullable). One row per (hospital, day). Required: at least one non-null `open_time`/`close_time` row per hospital before activation. Lunch fields default to null (no break). Both lunch fields must be set or both null — partial is invalid. **Limitation:** one break per day. If a hospital has more complex schedules (e.g., two breaks, split shifts), capture in a free-text note and address in a future schema iteration.</span>
- <span style="color:#059669">New table `hospital_component_durations`: composite PK (`hospital_id`, `component`); `component` (enum: `whole_blood`, `sdp`, `platelets`, `ffp`, `cryo`, `prbc`); `processing_minutes` (int) — total elapsed time from donor arrival to leaving, includes checklist + screening + procedure; `notes` (text, nullable — e.g., "requires apheresis machine; only Mon-Fri"). Absence of a row for a component means the hospital does not process that component.</span>
- <span style="color:#059669">`profiles`: add `onboarding_status` (enum: `pending_self_registration`, `pending_onboarding`, `active`, `suspended`) — applicable to hospital profiles. Self-registration sets `pending_onboarding`; backend-team completion sets `active`.</span>
- <span style="color:#059669">New table `partner_groups`: `id`, `name`, `leader_id` (FK to profiles), `city`, `created_at`.</span>
- <span style="color:#059669">New table `notifications`: `id`, `donor_id`, `type` (enum: `thank_you` / `milestone` / `timing_reminder` / `feedback_prompt` / `emergency_broadcast` / `personal_outreach`), `payload` (jsonb), `sent_at`, `delivery_channel` (enum: `in_app` / `whatsapp` / `sms`), `delivered_at`, `read_at`.</span>
- <span style="color:#059669">New table `referrals`: `referrer_id` (FK), `referee_id` (FK), `created_at`, `first_donation_at` (nullable, set on referee's first `donated` acceptance).</span>
- <span style="color:#059669">New table `audit_log`: `id`, `actor_id`, `action`, `target_type`, `target_id`, `details` (jsonb), `created_at`. For admin moderation actions and any destructive operation.</span>
- <span style="color:#059669">New table `change_requests`: `id`, `requester_id` (FK to profiles — hospital admin or donor), `requester_role` (enum: `hospital`, `donor`), `target_type` (enum: `hospital_hours`, `hospital_component_durations`, `hospital_settings`, `donor_profile`, `acceptance_override`, `other`), `target_id` (uuid, nullable — points at the specific row/record being changed), `payload` (jsonb — proposed new values), `reason` (text — why the change is requested), `status` (enum: `pending`, `approved`, `rejected`, `cancelled`), `submitted_at`, `reviewer_id` (FK to admin profile, nullable), `reviewed_at` (timestamptz, nullable), `reviewer_note` (text, nullable). Receives both hospital-initiated edit requests (rule 22) and donor-initiated profile/edge-case requests. All actions appended to `audit_log`.</span>
---
 
## 9. Business rules
 
1. **One active acceptance per donor.** A donor with any `acceptances.status = 'accepted'` row cannot accept another request until they withdraw it or it terminates (`donated` / `rejected`).
2. **City + blood group exact match.** Donors see only `blood_requests` whose `blood_group` matches theirs and whose hospital's `city` matches theirs, case- and whitespace-insensitive.
3. **Eligibility.** A donor is eligible 90 days after their last `donated` acceptance. The UI blocks acceptance during the cooldown.
4. **Lives saved.** Each `donated` acceptance counts as 3 lives saved (1 unit can be split into 3 components).
5. **Attender uniqueness.** A donor can be attender on at most one `open` request at a time.
6. **Attender disallowed on scheduled requests.** Only critical and urgent requests may have an attender.
7. ~~**Acceptance withdrawal.** A donor may DELETE their acceptance only while it is in `accepted` state. Once it is `donated` or `rejected`, it is immutable from the donor side.~~ <span style="color:#059669">**[REVISED]** `donated` and `rejected` remain immutable from the donor side. While in `accepted` state, the donor may exit via a tiered flow defined in rules 7a-7d below. Soft confirmation gates the original acceptance so accidental taps don't reach the tiered exit.</span>
   <span style="color:#059669">**7a. Soft confirmation on accept.** Before an acceptance is written, the donor sees a confirmation prompt ("Are you sure? Hospital is counting on you.") with [Yes, I'll be there] / [No, go back]. Acceptance is only recorded after [Yes]. Applies to both web and WhatsApp flows. `confirmed_at` timestamp is set at this moment.</span>
   <span style="color:#059669">**7b. Tier 1 — Easy cancel (≤5 min after `confirmed_at`).** Donor may cancel with one tap, no reason captured. `acceptances.status` moves to `cancelled`. Matching engine treats the slot as un-accepted (returns to open pool). Hospital and attender are **not** notified — too fast to be useful and would create noise. Window is exactly 5 minutes from `confirmed_at`.</span>
   <span style="color:#059669">**7c. Tier 2 — Withdraw with reason (>5 min after `confirmed_at` AND >1 hr before show-up time).** Donor selects a reason from {`emergency`, `health`, `schedule_conflict`, `mistake`, `other`}; free-text note optional. Status moves to `withdrawn`, `withdrawn_at` set. Hospital + attender receive a WhatsApp notification with the reason. Donor is shown the attender's phone with a courtesy-call prompt (not blocking). Slot is re-broadcast by the matching engine.</span>
   <span style="color:#059669">**7d. Tier 3 — Late withdrawal (≤1 hr before show-up, or already past it).** Same reason dropdown; free-text note **mandatory**. Status moves to `withdrawn_late`. Hospital + attender get an **immediate escalation** WhatsApp. Matching engine auto-rebroadcasts with urgency bumped one level (e.g., `urgent` → `critical`). Late withdrawals are captured for donor reliability tracking; consequences (e.g., visibility restrictions, soft warnings) are intentionally deferred — captured as an open question in §12.</span>
   <span style="color:#059669">**7e. No-show vs. late withdrawal.** If a donor neither donates nor withdraws by `show_up_by + 30 min`, the hospital may mark the acceptance `no_show`. This is distinct from `withdrawn_late` — the donor never communicated. No-show is treated more severely than late withdrawal in any future reliability scoring. Platform-side messaging to donors makes this preference explicit: "if you can't come, please withdraw — don't ghost."</span>
<span style="color:#059669">**[NEW] Business rules (eligibility specifics, encoded from clinical guidelines shared by Rashtrotthana, M006-M007):**</span>
 
8. <span style="color:#059669">**Whole-blood cooldown by sex.** Male donors: 90 days (3 months). Female donors: 120 days (4 months). Supersedes the flat 90-day rule (rule 3) for whole-blood donations.</span>
9. <span style="color:#059669">**Cross-component cooldowns:**</span>
   - <span style="color:#059669">Whole blood → SDP / platelets: 28 days</span>
   - <span style="color:#059669">SDP → SDP: 15 days</span>
   - <span style="color:#059669">SDP → whole blood: 28 days</span>
   - <span style="color:#059669">Platelets max frequency: 12 donations / year (≈30-day minimum gap)</span>
   - <span style="color:#059669">Whole blood max frequency (red-cell biology, 120-day RBC lifespan): 4 donations / year</span>
10. <span style="color:#059669">**Weight requirements.** Whole blood: ≥ 45 kg. SDP: ≥ 50 kg. Enforced at registration and re-checked at the collection-point checklist.</span>
11. <span style="color:#059669">**Donor preferences gate matching.** A donor with preferences set is shown only requests where (a) the hospital donation hours overlap with the donor's preferred times, and (b) the component matches the donor's preferred type. Emergency / critical requests bypass this filter.</span>
12. <span style="color:#059669">**Hospital open hours gate acceptance.** A donor cannot accept a request if the hospital is closed at the moment of acceptance AND the urgency is not critical. (Critical bypasses.)</span>
13. <span style="color:#059669">**"Any compatible group" expansion.** When `accept_any_compatible_group = true`, the donor pool expands per the ABO/Rh compatibility matrix (O− universal donor; AB+ universal recipient; etc.). Donors with unknown blood group only see these requests.</span>
14. <span style="color:#059669">**Emergency broadcast escalation.** A critical or urgent request triggers a tiered broadcast: initial cohort of N donors within R km → if <M acceptances in T min, expand radius to R' km and re-broadcast. Tunable per urgency by Admin.</span>
15. <span style="color:#059669">**Feedback eligibility.** A donor may submit feedback on a hospital only after a `donated` acceptance. One feedback per acceptance.</span>
16. <span style="color:#059669">**Group leader referral attribution.** A donor registered via a group leader's referral link is permanently tagged. Donations by that donor are credited to the leader's group dashboard.</span>
17. <span style="color:#059669">**Referrer credit.** Donor A who refers donor B is credited on B's first `donated` acceptance (via `referrals.first_donation_at`). Used for refer-a-friend leaderboards but no monetary incentive.</span>
18. <span style="color:#059669">**Voluntary-donation integrity.** Any donor flagged for asking for money or any hospital flagged for paying donors is automatically suspended pending admin review. Audit-logged.</span>
19. <span style="color:#059669">**Donor arrival-window calculation.** When a donor accepts a request, the platform computes an **arrival window** — `earliest_arrival` and `latest_arrival` — for the donor, accounting for hospital hours, lunch/break, and the request deadline. Both values are surfaced on the confirmation screen, on the dashboard, in the post-acceptance follow-up message (§6.5), and in the day-of timing reminder:</span>
    - <span style="color:#059669">**`latest_arrival`** = `min(request.required_by, hospital_close_time_on_donation_day) − processing_minutes`. This is the absolute latest the donor can arrive and still finish the donation in time.</span>
    - <span style="color:#059669">**`earliest_arrival`** = `max(now, hospital_open_time_on_donation_day)`. If the hospital is already open, earliest = now; otherwise the next open moment today.</span>
    - <span style="color:#059669">**Lunch / break handling.** If a `lunch_start_time` / `lunch_end_time` exists for that day on `hospital_hours`, the platform splits the day into two valid arrival windows:</span>
      - <span style="color:#059669">**Morning window:** `earliest_arrival` → `lunch_start_time − processing_minutes` (donor must finish before lunch begins).</span>
      - <span style="color:#059669">**Afternoon window:** `lunch_end_time` → `latest_arrival` (donor arrives after lunch ends).</span>
      - <span style="color:#059669">The platform surfaces both windows to the donor — "Arrive 9:00 AM–11:30 AM or 2:00 PM–2:30 PM. Hospital is closed 1:00–2:00 PM for lunch." — and lets them pick implicitly by when they arrive. If only one window is viable (e.g., morning is in the past, afternoon is too late), only that one is shown.</span>
    - <span style="color:#059669">**Constraint:** `latest_arrival ≥ earliest_arrival`. If not, the request is **not acceptable** on that hospital on that day; donor sees "too late for today, try tomorrow" and the acceptance is blocked.</span>
    - <span style="color:#059669">If `latest_arrival` is already in the past at the moment of acceptance, blocked as above.</span>
    - <span style="color:#059669">If the donor's accepted request rolls over to the next operating day, both `earliest_arrival` and `latest_arrival` are recomputed using that day's hours and lunch break.</span>
    - <span style="color:#059669">Reasoning is exposed inline to the donor — e.g., *"Sankara Hospital opens at 9:00 AM, closes for lunch 1:00–2:00 PM, closes at 5:00 PM. SDP takes ~2.5 hours including checklist & screening. Earliest arrival: 9:00 AM. Latest arrival: 2:30 PM."*</span>
20. <span style="color:#059669">**Component-availability gating.** A donor cannot accept a request for a component that the hospital does not have a `hospital_component_durations` row for. Implies the hospital does not process that component. Admin sees these gating misses in the operational alerts feed.</span>
21. <span style="color:#059669">**Hospital activation gate.** A hospital's `onboarding_status` transitions to `active` only when **all** of the following are true:</span>
    - <span style="color:#059669">At least one `hospital_hours` row with non-null open/close exists.</span>
    - <span style="color:#059669">At least one `hospital_component_durations` row exists (i.e., the hospital supports at least one component).</span>
    - <span style="color:#059669">A `primary_donor_contact_name` and `primary_donor_contact_phone` are recorded on `hospital_settings`.</span>
    - <span style="color:#059669">A BloodConnect backend-team member has reviewed and clicked "Activate" in the admin onboarding workflow.</span>
    - <span style="color:#059669">**Until `active`,** the hospital cannot post requests; their dashboard shows an onboarding-pending banner and a contact-us link.</span>
22. <span style="color:#059669">**Hours and durations are not self-editable post-activation.** Hospitals may not modify `hospital_hours` or `hospital_component_durations` from their dashboard. Changes flow through an admin-support request that triggers an admin/backend-team edit (audit-logged). This is a deliberate data-quality safeguard, not a permissions oversight.</span>
---
 
## 10. Out of scope / known gaps
 
- ~~No explicit "close" / "fulfilled" action on a `blood_requests` row by the hospital.~~ <span style="color:#059669">**Moving in-scope M005** — explicit `fulfilled` / `cancelled` action added (see §5.2, §6.3).</span>
- ~~No SMS / WhatsApp / email notification rail. A donor must have the dashboard open to be alerted in realtime.~~ <span style="color:#059669">**Moving in-scope M005-M012** — WhatsApp delivery for thank-you, milestones, timing reminders, emergency broadcast, and feedback prompts. SMS as fallback. Email remains out of scope.</span>
- No identity verification for donors or hospitals beyond email and self-declared license number. <span style="color:#059669">**(Still out of scope.)**</span>
- ~~No multi-city or multi-tenant org model — a hospital is a single entity tied to one city.~~ <span style="color:#059669">**Partially in-scope M013** — adjacent Bengaluru districts (Anekal, Devanahalli, Hoskote, Nelamangala, Magadi) supported. Full pan-India still out of scope.</span>
- ~~No admin moderation (user suspension, request deletion, attender override).~~ <span style="color:#059669">**Moving in-scope M008** — suspend, delete, reassign, all audit-logged.</span>
- ~~No audit trail of who edited a request.~~ <span style="color:#059669">**Moving in-scope M008** — `audit_log` table introduced; all destructive admin actions logged.</span>
- No public, unauthenticated request feed. <span style="color:#059669">**(Still out of scope.)** A partner-leader read-only dashboard is in scope M010 instead.</span>
<span style="color:#059669">**[Still firmly out of scope]:**</span>
 
- <span style="color:#059669">Identity verification (Aadhaar / government ID).</span>
- <span style="color:#059669">Blood-bank inventory tracking (units stored, expiry per bag).</span>
- <span style="color:#059669">Native mobile apps (web responsive is the only delivery surface).</span>
- <span style="color:#059669">Payments, paid incentives, monetary referral rewards.</span>
- <span style="color:#059669">Pan-India coverage beyond Bengaluru-adjacent districts.</span>
- <span style="color:#059669">Cross-state donor logistics (transport, accommodation).</span>
- <span style="color:#059669">Health screening / pre-donation eligibility questionnaires (handled in-person at the camp).</span>
---
 
## 11. Success metrics
 
| Metric | Definition | Target (90 days post-launch) |
|---|---|---|
| **Time to first responder** | Median time between `blood_requests.created_at` and first `acceptances.created_at` on the request | ≤ 10 minutes for critical, ≤ 30 minutes for urgent |
| **Fulfillment rate** | % of `open` requests that reach `donated` count ≥ `units` | ≥ 60% for critical |
| **Donor activation** | % of registered donors who have at least one `accepted` acceptance | ≥ 30% |
| **Donor retention** | % of donors with a second `donated` acceptance within 6 months | ≥ 15% |
| **Hospital activation** | % of registered hospitals that post ≥ 1 request in their first 14 days | ≥ 70% |
 
<span style="color:#059669">**[NEW metrics for M005+ (90 days post-Phase-completion):**</span>
 
| <span style="color:#059669">Metric</span> | <span style="color:#059669">Definition</span> | <span style="color:#059669">Target</span> |
|---|---|---|
| <span style="color:#059669">**Donor preference completion**</span> | <span style="color:#059669">% of donors with preferences set (frequency, type, days)</span> | <span style="color:#059669">≥ 70% within 30 days of registration</span> |
| <span style="color:#059669">**Cold-call uplift**</span> | <span style="color:#059669">Response rate on platform vs. baseline blood-bank cold-call (~10%)</span> | <span style="color:#059669">≥ 25%</span> |
| <span style="color:#059669">**Feedback response rate**</span> | <span style="color:#059669">% of `donated` acceptances with donor feedback submitted</span> | <span style="color:#059669">≥ 40%</span> |
| <span style="color:#059669">**Hospital cordiality score**</span> | <span style="color:#059669">Rolling 30-day donor rating per hospital</span> | <span style="color:#059669">≥ 4.0 / 5</span> |
| <span style="color:#059669">**Camp time per donor**</span> | <span style="color:#059669">Median time donor spends from arrival to leaving</span> | <span style="color:#059669">≤ 45 min (from baseline 90-120 min)</span> |
| <span style="color:#059669">**Referral activation**</span> | <span style="color:#059669">% of donors who refer ≥1 friend within 90 days</span> | <span style="color:#059669">≥ 15%</span> |
| <span style="color:#059669">**Group leader engagement**</span> | <span style="color:#059669">% of partner orgs with ≥5 active donors at 60 days</span> | <span style="color:#059669">≥ 60%</span> |
| <span style="color:#059669">**Emergency response time (critical)**</span> | <span style="color:#059669">Median time-to-first-acceptance for critical requests</span> | <span style="color:#059669">≤ 5 min (vs. MVP ≤10 min target)</span> |
| <span style="color:#059669">**Emergency response time (urgent)**</span> | <span style="color:#059669">Median time-to-first-acceptance for urgent requests</span> | <span style="color:#059669">≤ 15 min (vs. MVP ≤30 min target)</span> |
 
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
<span style="color:#059669">**[NEW] Post-MVP increments (M005+, scoped from May 2026 customer meetings):**</span>
 
- <span style="color:#059669">**M005 — Donor engagement loop + change-of-mind flow.** Thank-you message, milestone congratulations (10/25/50/100), social-media share card, hospital feedback prompt, explicit `fulfilled`/`cancelled` close on requests. **Donor exit flow:** soft confirmation on accept; tiered cancel/withdraw (rules 7a-7e) with 5-min easy-cancel window, 1-hour cutoff for late withdrawal, hospital-side `no_show` marker. Mirrored across web and WhatsApp surfaces (M012 dependency for WhatsApp parity). Schema: extend `acceptances.status` enum, add `confirmed_at` / `withdrawn_at` / `withdrawal_reason` / `withdrawal_note`.</span>
- <span style="color:#059669">**M006 — Donor preferences + profile.** Donation frequency, preferred component, preferred days/times, public profile page, sex/weight fields, updated cooldown rules (rules 8-10).</span>
- <span style="color:#059669">**M007 — Hospital onboarding gate, settings & donor show-up time.** *(Expanded scope.)* Backend-team onboarding workflow that gates hospital activation; per-day operating hours (Mon-Sun); per-component processing durations (donor arrival → leaving, including checklist & screening); donor "show up by HH:MM" calculation and display on acceptance, dashboard, and timing reminder; component-availability gating; "any compatible group" request type; delete-attender-message action; blood-bank per-donor checklist. Net new tables: `hospital_hours`, `hospital_component_durations`; expanded `hospital_settings`; new `profiles.onboarding_status` enum.</span>
- <span style="color:#059669">**M008 — Admin operational core.** *(Scope tightened: dashboards/analytics deferred to M015.)* Change-request inbox (receives & processes edit requests from hospitals and donors); moderation actions (suspend/delete/reassign); audit log. Hospitals route all post-activation edits to hours, lunch breaks, processing durations, and supported components through this inbox (rule 22). Donors route profile corrections (blood group post-confirmation, zip, phone) through the same inbox.</span>
- <span style="color:#059669">**M009 — Emergency broadcast logic.** Tiered radius expansion (rule 14), configurable N/R/M/T parameters per urgency, admin tuning panel.</span>
- <span style="color:#059669">**M010 — Group leader role + onboarding.** Partner-organization referral links, group-leader dashboard, `partner_groups` table, member tagging.</span>
- <span style="color:#059669">**M011 — Donor education + flexible registration.** Guidelines page, "don't know my blood group" registration path, post-donation care info.</span>
- <span style="color:#059669">**M012 — Notification rails.** WhatsApp + SMS-fallback delivery for thank-you, timing reminders, emergency broadcast, feedback prompts, milestones, personal outreach.</span>
- <span style="color:#059669">**M013 — Multi-city (limited).** Bengaluru + adjacent districts (Anekal, Devanahalli, Hoskote, Nelamangala, Magadi).</span>
- <span style="color:#059669">**M014 — Refer-a-friend + bring-a-friend.** Referral codes, guest pre-registration at camps, referrer credit on referee's first donation.</span>
- <span style="color:#059669">**M015 — Analytics & dashboards.** *(Deferred from M008.)* Response-rate analytics (per-city, per-blood-group, per-urgency, time-to-first-acceptance); hospital satisfaction score view (rolling 30-day, per-hospital drill-in); group-leader dashboard (members, donations, engagement); operational alert thresholds (critical > 15 min, urgent > 45 min, hospital satisfaction < 3.5). All underlying data is captured from M005/M007/M008 onward; this phase only builds the visualisations. Rationale: ship the operational primitives first; let real usage tell us which aggregates matter.</span>
<span style="color:#059669">**[NEW] Open questions captured but not yet specced:**</span>
 
- <span style="color:#059669">**"Hospital pool" vs. "Coordinator pool"** distinction (Vinod, Image 4) — should we model two donor pools per hospital, or just tag donors with their primary affiliation? Owner: Shankar + Vinod.</span>
- <span style="color:#059669">**Camp / event modelling** — are camps first-class entities, or are they `blood_requests` with `urgency = scheduled` + a venue field? Affects M014's "bring a friend" flow.</span>
- <span style="color:#059669">**Corporate / college / Lions Club / Rotary onboarding** — same as group leader (M010) or a separate flow? Need to confirm with each org type.</span>
- <span style="color:#059669">**Mr. Chandrakanth follow-up** (Image 2) — what was his specific commitment? Capture in CRM.</span>
- <span style="color:#059669">**Roopchand contacts** (Image 2: 80733 13853, 91644 63666) — relationship and follow-up to be captured in CRM.</span>
- <span style="color:#059669">**Samraksha** (Image 1) — relationship to be clarified. Partner org? Reference org? Patient referral source?</span>
- <span style="color:#059669">**PAS (platelet additive solution)** — operational consumable at collection point; may not need PRD treatment but should appear in the Blood Bank checklist's medical inputs.</span>
- <span style="color:#059669">**National Blood Donation Drive** integration (Image 4) — feasibility of pulling live national stats (8L-12L donations) for context display on admin/marketing pages.</span>
- <span style="color:#059669">**Kidwai, Victoria, Vani Vilas** target hospitals (Image 3) — onboarding plan and timeline.</span>
- <span style="color:#059669">**Donor reliability consequences.** Late withdrawals and no-shows are captured in the data model (M005). But the *consequences* — e.g., visibility restrictions (only-scheduled-requests-for-14-days after 3 late withdrawals in 6 months), soft warnings, leaderboard penalties — are intentionally deferred. Want to ship the data plumbing first and let real usage tell us where the threshold should sit. Owner: Shankar + Vinod.</span>
- <span style="color:#059669">**No-show grace buffer.** Rule 7e uses `show_up_by + 30 min` as the trigger for the hospital to mark `no_show`. Is 30 min the right buffer? Some hospitals may want shorter (peak hours, queue impact); some may want longer (traffic, donor in transit). Worth a per-hospital override or just one platform default — confirm with Vinod/Sankara.</span>
- <span style="color:#059669">**Soft confirm fatigue.** If a donor accepts 10 requests in their first month and is asked "Are you sure?" every time, it becomes muscle-memory and stops catching mistakes. Worth A/B-ing whether to ease up on the confirm after N completed donations, or to keep it constant for everyone.</span>
---
 
<span style="color:#059669">**Reviewers' note:** All additions and modifications since 2026-05-11 are highlighted in green. Strikethrough on text in §10 indicates items that moved from "out of scope" to "in scope." After review, run a find-and-replace on `<span style="color:#059669">` and `</span>` tags to strip the markup before merging into the canonical spec.</span>
