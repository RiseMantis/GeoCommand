# Backend Build Instructions — Multi-Hazard Disaster Prediction Platform

*Companion to `PRD_Disaster_Prediction_Prototype.md`. This file is scoped to the backend only: core API + authentication/RBAC for the hackathon prototype.*

---

## 0. What this file is for

The frontend PRD (Section 6) deliberately kept all state client-side with no backend, so the UI prototype could be built and demoed with zero setup. This file is for the version one step up: a **real, running backend** with **real authentication** behind the same demo, so the "Secure Access Control" and "Audit & Forensics" parts of the pitch are genuinely enforced server-side instead of simulated in React state.

It is still a **hackathon-scoped backend** — real auth and real API, but mocked/synthetic hazard data (no live satellite ingestion, no trained ML model). Paste Section 6 directly into an AI coding tool (Claude Code, Cursor, Replit AI, Lovable, etc.) to generate it.

---

## 1. Scope

### 1.1 In scope

- A running HTTP API (FastAPI) backing the dashboard, region/hazard data, the spoof-detection demo, and the audit log.
- **Real authentication**: signup/login, hashed passwords, JWT-based sessions.
- **Real role-based access control (RBAC)**: 4 roles (Analyst, Disaster Response Coordinator, Government/Civil Defence Administrator, Public Information Officer), enforced server-side on protected endpoints — not just hidden in the UI.
- A real, persisted **audit log** — every query, alert issuance, and spoof-block event is written to the database with actor, role, and timestamp.
- A **simulated data-integrity check** endpoint that mimics hash/metadata verification (Section 5.3 of the PRD) using a fixed rule, not a real cryptographic pipeline — but genuinely runs server-side and genuinely blocks/allows based on it.
- Seed data for 5 mock regions × up to 5 hazards, served from the database (not hardcoded in the frontend).

### 1.2 Out of scope

- Real satellite data ingestion (GEE, Copernicus, NASA Earthdata, etc.).
- Any trained ML model — hazard probability/severity are seeded/deterministic values, optionally recomputed by a simple formula.
- Production-grade security infra: no Auth0/Keycloak, no Cloudflare WAF, no TEEs/SGX, no Merkle trees. JWT + bcrypt + RBAC is the real, correctly-implemented core; everything past that is described in the PRD as future work, not built here.
- Horizontal scaling, rate limiting, containerized deployment — a single-process dev server is fine for a hackathon demo.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Python + FastAPI** | Matches the pitch deck's stated stack; async, fast to scaffold, auto-generates OpenAPI docs for free (useful for a demo/judges) |
| Database | **SQLite** via SQLAlchemy (swap to Postgres later with the same models) | Zero setup — a single file, no separate DB server needed for a hackathon |
| Auth | **JWT (python-jose) + bcrypt (passlib)** | Real, standard, and simple to reason about — no third-party auth provider needed |
| Validation | **Pydantic v2** | Comes free with FastAPI |
| Migrations | Not required — use `Base.metadata.create_all()` on startup for a hackathon build | Keeps setup to one command |
| Docs | FastAPI's built-in `/docs` (Swagger UI) | Free interactive API explorer to show judges |

---

## 3. Data Model

```
User
  id            UUID (pk)
  name          str
  email         str (unique)
  password_hash str
  role          enum: analyst | coordinator | administrator | pio
  created_at    datetime

Region
  id            str (pk, e.g. "kali-basin")
  name          str
  lat           float
  lng           float

HazardScore
  id            UUID (pk)
  region_id     fk -> Region.id
  hazard_type   enum: flood | wildfire | landslide | cyclone | drought
  probability   float (0-1)
  severity      enum: low | medium | high
  signals       JSON list[str]
  updated_at    datetime

Recommendation
  id            UUID (pk)
  region_id     fk -> Region.id
  hazard_type   enum
  text          str

Alert
  id            UUID (pk)
  region_id     fk -> Region.id
  hazard_type   enum
  issued_by     fk -> User.id
  status        enum: issued | overridden | cancelled
  created_at    datetime

AuditLogEntry
  id            UUID (pk)
  timestamp     datetime
  actor_id      fk -> User.id (nullable, for system events)
  actor_role    str
  action        str            -- e.g. "queried_region", "issued_alert", "blocked_spoofed_tile"
  detail        JSON            -- free-form context (region_id, hazard_type, tile hash, etc.)

SpoofEvent   (drives the "Inject Spoofed Data" demo)
  id                UUID (pk)
  region_id         fk -> Region.id
  claimed_value     str    -- e.g. "12% inundation"
  actual_value      str    -- e.g. "46% inundation"
  tile_hash         str
  hash_valid        bool
  result            enum: blocked | accepted
  created_at        datetime
```

---

## 4. Authentication & RBAC Design

### 4.1 Roles (must match the PRD exactly)

| Role | Can do |
|---|---|
| `analyst` | Log in, view regions/hazards/heatmaps, submit NL queries, view audit log (read-only) |
| `coordinator` | Everything Analyst can, plus: view/act on response recommendations, acknowledge alerts |
| `administrator` | Everything above, plus: **issue** and **override/cancel** public alerts |
| `pio` (Public Information Officer) | View issued alerts, mark an alert as "published" externally |

### 4.2 Auth flow

1. `POST /auth/register` — create a user with a role (for the demo, allow open registration or seed 4 pre-made accounts, one per role — seeding is faster for a live demo, see Section 7).
2. `POST /auth/login` — verify email + password (bcrypt), return a signed JWT (`sub`=user id, `role`=role, short expiry e.g. 8h — long enough to survive a demo without needing refresh tokens).
3. Protected routes require `Authorization: Bearer <token>`; a FastAPI dependency decodes the JWT and attaches `current_user` (id, role) to the request.
4. A `require_role(*roles)` dependency wraps any endpoint that needs role gating (e.g. `require_role("administrator")` on the issue-alert endpoint). A 403 with a clear message (`"Requires administrator role"`) is returned on failure — this should exactly mirror the tooltip text used in the frontend PRD (Section 11.4) so the UI and API agree.
5. Every successful protected action writes an `AuditLogEntry` — this is not optional; it's the point of the exercise (Section 5.3/12 of the PRD: "who accessed the data, who issued the alert").

### 4.3 Password handling

- Hash with bcrypt via `passlib.context.CryptContext`. Never store or log plaintext passwords.
- No password reset flow needed for a hackathon demo — out of scope.

---

## 5. API Endpoints

| Method & Path | Auth | Role gate | Purpose |
|---|---|---|---|
| `POST /auth/register` | none | — | Create a user (email, password, role) |
| `POST /auth/login` | none | — | Return a JWT |
| `GET /auth/me` | JWT | any | Return the current user's profile + role |
| `GET /regions` | JWT | any | List all regions with lat/lng |
| `GET /regions/{id}` | JWT | any | Region detail: all hazard scores, signals, recommendation |
| `GET /regions/{id}/hazards?type=flood` | JWT | any | Filter hazards by type |
| `POST /query` | JWT | any | Body: `{ "text": "..." }` → keyword-match (or LLM call, see 5.1) against regions, returns best-match region id + logs an audit entry |
| `POST /alerts` | JWT | `administrator` | Body: `{ region_id, hazard_type }` → creates an Alert, logs audit entry |
| `PATCH /alerts/{id}` | JWT | `administrator` | Override/cancel an existing alert, logs audit entry |
| `GET /alerts` | JWT | any | List alerts (for PIO/Coordinator visibility) |
| `POST /spoof-demo/inject` | JWT | any (demo trigger) | Kicks off the scripted spoof scenario for a region; returns the 4-step detection sequence payload and creates a `SpoofEvent` + audit entries server-side |
| `GET /audit-log` | JWT | any (read-only) | Reverse-chronological list of audit entries, paginated |

### 5.1 Natural-language query endpoint (stretch goal)

`POST /query` can start as pure keyword matching against region names/signals. If time allows, swap the matcher for a real call to the Anthropic Messages API (server-side, so the API key never reaches the browser): send the query text plus a compact JSON summary of all regions, ask the model to return `{ "region_id": "...", "reason": "..." }` as JSON, and fall back to keyword matching if the call errors or times out. Doing this server-side (rather than client-side as suggested for the pure-frontend prototype) is the right call once a backend exists, since it keeps the API key off the client.

---

## 6. Ready-to-Paste Build Prompt

Paste this into an AI coding tool (Claude Code, Cursor, Replit AI, etc.) to scaffold the backend in one pass.

```
Build a FastAPI backend for a "Multi-Hazard Disaster Prediction" hackathon
prototype. This backend must have REAL, working authentication and
role-based access control — that is the one part of this build that
should NOT be mocked. Hazard/satellite data itself IS mocked/seeded;
there is no real ML model and no real satellite ingestion.

STACK: Python, FastAPI, SQLAlchemy + SQLite (single file db.sqlite3),
Pydantic v2, python-jose for JWT, passlib[bcrypt] for password hashing.
Single process, runnable with `uvicorn main:app --reload`, no external
services or API keys required for the core build.

DATA MODELS (SQLAlchemy):
- User: id (uuid), name, email (unique), password_hash, role
  (enum: analyst, coordinator, administrator, pio), created_at
- Region: id (str pk, e.g. "kali-basin"), name, lat, lng
- HazardScore: id (uuid), region_id (fk), hazard_type
  (enum: flood, wildfire, landslide, cyclone, drought),
  probability (float 0-1), severity (enum: low, medium, high),
  signals (JSON list of strings), updated_at
- Recommendation: id (uuid), region_id (fk), hazard_type, text
- Alert: id (uuid), region_id (fk), hazard_type, issued_by (fk User),
  status (enum: issued, overridden, cancelled), created_at
- AuditLogEntry: id (uuid), timestamp, actor_id (fk User, nullable),
  actor_role (str), action (str), detail (JSON)
- SpoofEvent: id (uuid), region_id (fk), claimed_value, actual_value,
  tile_hash, hash_valid (bool), result (enum: blocked, accepted),
  created_at

AUTH:
- POST /auth/register — body {name, email, password, role}. Hash the
  password with bcrypt before storing. Reject duplicate emails with 409.
- POST /auth/login — body {email, password}. Verify with bcrypt,
  return {access_token, token_type: "bearer", role}. JWT payload should
  contain sub (user id) and role, expiry 8 hours.
- GET /auth/me — protected, returns the current user's id, name, email,
  role, decoded from the Authorization: Bearer <token> header.
- Implement a get_current_user FastAPI dependency that decodes the JWT
  and raises 401 if missing/invalid/expired.
- Implement a require_role(*allowed_roles) dependency factory that
  raises 403 with detail "Requires <role> role" (use the actual
  required role name) if the current user's role is not in the allowed
  set. Use this to gate POST /alerts and PATCH /alerts/{id} to the
  "administrator" role only.

CORE ENDPOINTS (all except register/login require a valid JWT):
- GET /regions — list all regions with id, name, lat, lng, and a
  computed "highest_severity" field across their hazards.
- GET /regions/{id} — full detail: all HazardScore rows for that
  region (probability, severity, signals) plus its Recommendation(s).
- GET /regions/{id}/hazards?type=flood — filter hazards for one region.
- POST /query — body {text}. Do simple case-insensitive keyword
  matching of the text against region names and hazard signals; return
  the best-matching region_id (or null) plus a short reason string.
  Log an AuditLogEntry with action="nl_query".
- POST /alerts — role-gated to administrator. Body
  {region_id, hazard_type}. Creates an Alert with status="issued",
  issued_by=current user. Log an AuditLogEntry with action=
  "issued_alert" and detail including region_id and hazard_type.
- PATCH /alerts/{id} — role-gated to administrator. Body
  {status: "overridden" | "cancelled"}. Updates the alert and logs an
  AuditLogEntry with action="alert_status_changed".
- GET /alerts — list all alerts, any authenticated role.
- POST /spoof-demo/inject — body {region_id}. Simulates injecting a
  manipulated SAR tile: pick a HazardScore for that region's flood
  hazard, generate a fake tile_hash and a claimed_value that's
  implausibly lower than actual_value (e.g. claimed "12% inundation"
  vs actual "46% inundation"). ALWAYS resolve as hash_valid=False and
  result="blocked" (this is a scripted demo, not real crypto). Create
  a SpoofEvent row AND four AuditLogEntry rows representing the
  detection steps: "hash_mismatch_detected",
  "cross_checked_against_rainfall_implausible", "tile_rejected",
  "forensic_report_logged" — each a few hundred ms apart is fine to
  fake with sequential timestamps; no need for real async delay.
  Return the full step sequence + the SpoofEvent as JSON so the
  frontend can animate through it.
- GET /audit-log — paginated (limit/offset query params), returns
  entries newest-first, each with timestamp, actor_role, action,
  detail.

SEED DATA (run on startup if the DB is empty):
- 4 demo users, one per role, e.g.
  analyst@demo.io / coordinator@demo.io / admin@demo.io / pio@demo.io,
  all with password "Demo1234!" (hashed) — print these credentials to
  the console on first run so they're easy to log in with during a
  live demo.
- 5 regions (a river basin, a forested hill district, a coastal
  cyclone-prone district, a drought-prone district, a landslide-prone
  hill town) with realistic lat/lng in India.
- 2-3 HazardScore rows per region with internally consistent
  probability/severity/signals (e.g. a "High" flood region should list
  rising rainfall/inundation signals, not contradictory ones), plus one
  Recommendation per region.
- 2-3 seed AuditLogEntry rows so the log isn't empty on first load.

CORS: enable permissive CORS (allow all origins) since this pairs with
a separately-hosted frontend prototype during the hackathon.

Add FastAPI's automatic /docs (Swagger UI) — leave it enabled, it's
useful for demoing the API directly to judges.

Do NOT build: real satellite data ingestion, a trained ML model,
password reset/email flows, refresh tokens, rate limiting, or any
production security infra (WAF, TEEs, Merkle trees) — those are
explicitly future-scope per the product PRD, not part of this backend.
```

---

## 7. Setup & Run

```bash
# from the backend project folder
python -m venv venv && source venv/bin/activate      # or use whatever the AI tool scaffolds
pip install fastapi uvicorn sqlalchemy pydantic python-jose[cryptography] "passlib[bcrypt]"
uvicorn main:app --reload
# API root:   http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

On first run, the seed step should print the 4 demo logins to the console — use those directly in the demo instead of registering a new account live (saves time on stage and avoids a typo mid-pitch).

---

## 8. Frontend Integration Notes

- Replace the frontend prototype's in-memory `regions` mock array with a `fetch('/regions')` / `fetch('/regions/{id}')` call once this backend is running; keep the mock JSON as a fallback if the backend isn't reachable, so the demo degrades gracefully rather than breaking.
- Store the JWT from `/auth/login` in memory (or `sessionStorage` outside of a Claude-artifact context — **do not use localStorage/sessionStorage inside a Claude artifact**, keep it in React state there) and attach it as `Authorization: Bearer <token>` on every subsequent call.
- The frontend's role switcher (Section 11.1 of the PRD) becomes a **real login as one of the 4 seeded users** instead of a UI-only toggle — swap the "pill selector" for a lightweight login screen with 4 quick-login buttons (one per seeded demo account) so switching roles on stage is still a single click.
- The "Issue Public Alert" button's disabled state (Section 11.4) should now reflect the JWT's actual role rather than local UI state, and the real `POST /alerts` 403 response is what proves RBAC is enforced server-side, not just hidden in the UI — worth calling out explicitly to judges.
- The "Inject Spoofed Data" animation (Section 11.3) now drives off the real `POST /spoof-demo/inject` response and the real `/audit-log`, so the audit trail is genuine, persisted evidence rather than a client-side illusion.

---

## 9. Pre-Demo Checklist

- [ ] Server starts cleanly with one command and seed data/logins print to console.
- [ ] Login works for all 4 seeded accounts; `/auth/me` returns the correct role for each.
- [ ] `POST /alerts` returns 403 for non-administrator roles and 201 for administrator.
- [ ] `POST /spoof-demo/inject` returns a consistent, demo-ready step sequence and writes rows to `AuditLogEntry`.
- [ ] `GET /audit-log` reflects every action taken during a full run-through of the Section 12 demo script.
- [ ] CORS is open enough that the frontend (wherever it's hosted for the demo) can reach the API without errors.
- [ ] `/docs` loads and is worth keeping open in a second tab in case a judge asks to see the API directly.