# Product Requirements Document

## Cross-Modal Satellite Data Fusion for Multi-Hazard Disaster Prediction & Early Warning

*Option C — Disaster Prediction & Early-Warning Platform*

| Field | Detail |
|---|---|
| Team | Meowiess (Shreya Wanjari, Mukund Chaurasiya, Neel Sankhe) |
| Event | NextGen Hack 2026 — Domain: Space Tech |
| Document purpose | Full product vision + scoped instructions to generate a working hackathon prototype |
| Prototype status | Demo-only build. No real satellite ingestion, no production security hardening. See Section 6. |
| Version | 1.0 |

---

## Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Users & Personas](#4-users--personas)
5. [Full Product Vision (Reference Architecture)](#5-full-product-vision-reference-architecture)
6. [Hackathon Prototype Scope — What We Are Actually Building](#6-hackathon-prototype-scope--what-we-are-actually-building)
7. [Prototype Feature List & Priorities](#7-prototype-feature-list--priorities)
8. [Prototype Tech Stack](#8-prototype-tech-stack)
9. [Prototype Architecture & Data Flow](#9-prototype-architecture--data-flow)
10. [Mock Data Specification](#10-mock-data-specification)
11. [UI / Screen Specifications](#11-ui--screen-specifications)
12. [Demo Script (Judging Walkthrough)](#12-demo-script-judging-walkthrough)
13. [Non-Functional Requirements (Prototype)](#13-non-functional-requirements-prototype)
14. [Success Metrics & Judging Alignment](#14-success-metrics--judging-alignment)
15. [AI Build Instructions — Ready-to-Paste Prompt](#15-ai-build-instructions--ready-to-paste-prompt)
16. [Appendix: Full Production Tech Stack (Future Reference)](#16-appendix-full-production-tech-stack-future-reference)

---

## 1. Executive Summary

The platform fuses multiple satellite data sources — optical, radar (SAR), thermal, precipitation, soil-moisture, and elevation — into a single, aligned view of a region, and runs per-hazard AI models to predict the probability and severity of floods, wildfires, landslides, cyclones, and droughts. Because a false alert can trigger unnecessary panic and a suppressed real alert can cost lives, the platform treats alert integrity as a core requirement: satellite inputs are hash- and metadata-verified, AI models are protected against tampering, access is role-based, and every prediction is auditable.

This PRD covers two layers on purpose:

- **The full product vision** — the complete system as pitched, including orbital data centers, live satellite ingestion, and hardened security infrastructure (Sections 5 and 16).
- **The hackathon prototype** — a scoped-down, fully working, demoable web app that an AI coding tool can generate in one session, using mocked/simulated data instead of live satellite feeds, and a simulated (not cryptographically real) security layer that visibly demonstrates the concept (Sections 6 onward).

Everything from Section 6 onward is written so it can be handed directly to an AI app-builder (Claude, Lovable, v0, bolt.new, Cursor, etc.) to generate a working, click-through prototype — not the production system.

---

## 2. Problem Statement

### 2.1 Escalating danger

The frequency of floods, cyclones, wildfires, landslides, and droughts has increased, and effective prevention requires tracking and warning ahead of the event rather than reacting after it — which is what motivates a predictive, always-on system rather than a reactive one.

### 2.2 Dispersed data

Satellite data is the most reliable input, but it is fragmented across many providers and sensor types (optical, radar, thermal, precipitation, soil moisture, elevation). A usable prediction model needs these fused into one aligned, queryable stack per region — a capability that is reusable beyond disaster prediction (e.g. mineral exploration, crop yield).

### 2.3 Risk of false or suppressed alerts

A false-positive alert causes panic and unnecessary evacuation cost; a false negative — or a maliciously suppressed real alert — risks lives. Because the alert pipeline itself becomes an attack surface (spoofed sensor tiles, tampered models, unauthorized alert overrides), cybersecurity has to be a first-class design requirement, not an add-on.

---

## 3. Goals & Objectives

| Objective | What it means |
|---|---|
| Fuse multiple sensor types | Combine optical, radar, thermal, precipitation, soil-moisture, and elevation data into one aligned regional view. |
| Detect early-warning signatures | Identify precursor patterns for each hazard before it escalates. |
| Predict hazard probability & severity | Score regions by likelihood and expected intensity per hazard type. |
| Generate hazard risk heatmaps | Interactive, per-hazard probability maps that update as new data arrives. |
| Recommend response actions | Suggest evacuation zones, safe corridors, and resource-staging coordinates. |
| Protect the alert pipeline | Verify data integrity, protect models from tampering, enforce role-based access, and log everything. |

---

## 4. Users & Personas

| Persona | Role privileges | Primary need |
|---|---|---|
| Analyst | Query data, view predictions & heatmaps | Explore hazard signatures across regions and sensors |
| Disaster Response Coordinator | View alerts, dispatch response recommendations | Fast, trustworthy guidance on where to stage resources |
| Government / Civil Defence Administrator | Issue / override public alerts | Confidence that an alert is genuine before it goes public |
| Public Information Officer | Publish approved alerts | A clear, defensible record of what was verified and why |

---

## 5. Full Product Vision (Reference Architecture)

This section documents the complete system as pitched. It is context for the judges and for future work — the hackathon prototype in Section 6 intentionally implements only a slice of this.

### 5.1 Datasets (production)

| Sensor type | Example datasets | Purpose |
|---|---|---|
| Optical / Multispectral | Sentinel-2, Landsat 8/9, MODIS | Vegetation dryness (NDVI), burn scars, flood-extent mapping |
| Thermal Infrared | MODIS LST, Landsat TIRS, VIIRS | Land-surface temperature, wildfire hotspot detection |
| SAR Radar | Sentinel-1, RISAT, ALOS PALSAR | All-weather / night flood mapping, ground deformation |
| Precipitation | GPM IMERG, TRMM, GSMaP | Rainfall intensity/accumulation — flood & landslide triggers |
| Soil Moisture | SMAP, SMOS, ESA CCI | Drought stress, slope-saturation risk |
| Elevation / Terrain | SRTM DEM, ASTER GDEM | Slope, drainage basins, flow accumulation |
| Atmospheric / Weather | NOAA GOES, INSAT-3D, ECMWF | Cyclone tracking, storm intensity, wind/pressure |

### 5.2 Production system workflow

1. **Collect data** — continuous ingestion of optical, radar, thermal, precipitation, soil-moisture, and elevation passes.
2. **Align the data** — radiometric correction, georeferencing, and resampling to a common spatial/temporal reference.
3. **Cross-modal & multi-hazard query** — analysts or automated triggers query by region, hazard, or natural language (e.g. "flag basins with rising SAR inundation and IMERG rainfall above the 90th percentile").
4. **AI hazard prediction** — hazard-specific features feed per-hazard models that output probability + severity.
5. **Generate results** — multi-hazard heatmap, confidence scores, response recommendations, and an explanation of which signals drove each alert.

### 5.3 Production cybersecurity layer

- **Satellite data verification** — hash, metadata, timestamp, and sensor authenticity checks before any data influences a prediction.
- **AI model protection** — detection of unauthorized model replacement, weight manipulation, adversarial inputs, and anomalous prediction behaviour vs. historical baselines.
- **Secure access control** — OAuth2 + role-based access (Analyst / Coordinator / Administrator / PIO); overriding a public alert requires authenticated, role-appropriate access.
- **Threat monitoring** — watches for spoofed sensor tiles, mass/automated querying of the alert API, and suspicious activity around high-consequence regions (dams, coastal settlements, evacuation routes).
- **Audit & forensics** — every prediction and alert is logged: who accessed data, which passes/models produced an alert, whether an input was modified, who issued or cancelled a warning.

### 5.4 Production security technologies

| Layer | Technology | Purpose |
|---|---|---|
| Authentication & Access | OAuth2 + Keycloak / Auth0 | Zero-trust RBAC with short-lived tokens |
| Data Integrity | SHA-256 + Merkle Trees | Detect tampered satellite files before they reach the model |
| Data-in-transit | AES-256-GCM + TLS 1.3 | Protect downlinks, streams, REST payloads |
| Secure AI Compute | Confidential Computing (TEEs / SGX) | Run models in hardware-isolated enclaves |
| API & Gateway Defence | FastAPI + Fail2ban / Cloudflare WAF | Prevent DDoS, scraping, unauthorized alert triggering |

### 5.5 Future extension: orbital AI data center

The long-term vision moves core data fusion and model inference onto satellite-based AI compute, so alerts don't wait on a ground downlink: only compressed insights (alerts, scores, heatmaps) are transmitted, distributed orbital nodes reduce single-point-of-failure risk, and solar-powered compute lowers the footprint of large-scale inference. This is a genuine follow-on research direction, not part of the hackathon deliverable.

---

## 6. Hackathon Prototype Scope — What We Are Actually Building

The prototype's job is to make the judges feel the idea working end-to-end in under three minutes. It should look and behave like the real product, but every data source, model, and security check underneath is simulated. Nothing in this section talks to a real satellite, a real ML model, or a real crypto/security stack — and that is by design for a time-boxed hackathon build.

### 6.1 In scope

- A single-page web app with a map-based dashboard showing risk heatmaps for 4-5 preset regions across 3 hazard types (flood, wildfire, landslide/cyclone).
- Clicking a region shows simulated per-hazard probability/severity scores, the "sensor signals" that drove them, and a recommended response (evacuation zone / staging point).
- A role switcher (Analyst / Coordinator / Administrator) that changes which actions are available — demonstrating RBAC without a real auth backend.
- A scripted "Inject Spoofed Data" demo button that simulates the exact attack-and-defence sequence described in Section 12, visibly walking through detection, rejection, and restoration.
- A live-updating Audit Log panel that records every simulated action (query, alert issued, spoof blocked) with timestamp, actor, and role.
- A natural-language query box that maps a handful of canned phrases to canned results (no real NLP/LLM call required, though a real LLM call is a nice-to-have — see 6.3).

### 6.2 Out of scope for the prototype

- Any real satellite/API ingestion (Sentinel, MODIS, NASA Earthdata, Google Earth Engine, etc.).
- Any trained ML model (XGBoost/PyTorch) — probability/severity scores are precomputed mock numbers or simple deterministic formulas.
- Real authentication, encryption, hashing, or a backend database — all state lives in the browser (React state), reset on refresh.
- Real Merkle trees, TEEs, WAF, or DDoS protection — these are represented as UI/log entries, not implemented.
- Mobile app, SMS/IVR fallback, drone dispatch, or orbital data center — vision-stage only (Section 5).

### 6.3 Nice-to-have if time allows

- Wire the natural-language query box to a real LLM call (e.g., an Anthropic API call from the client) so "parse this as a hazard query" is genuinely AI-driven.
- A second map layer toggle (e.g., switch between hazard types on the same map).
- A simple chart (Chart.js/Recharts) showing a 7-day trend of a risk score for the selected region.

---

## 7. Prototype Feature List & Priorities

| # | Feature | Priority | Notes |
|---|---|---|---|
| 1 | Map dashboard with region markers & risk color coding | P0 | Leaflet + OpenStreetMap tiles (no API key needed) |
| 2 | Region detail panel (hazard scores, driving signals, recommendation) | P0 | Mocked JSON per region |
| 3 | Hazard-type filter (Flood / Wildfire / Landslide / Cyclone / Drought) | P0 | Client-side filter over mock dataset |
| 4 | Role switcher (Analyst / Coordinator / Administrator) | P0 | Controls which buttons/actions are enabled |
| 5 | "Inject Spoofed Data" guided demo | P0 | The headline security moment — see Section 12 |
| 6 | Live audit log panel | P0 | Append-only list in React state |
| 7 | Natural-language query box (canned or real LLM) | P1 | Canned matching is enough; real LLM is a stretch goal |
| 8 | Risk trend mini-chart | P2 | Nice-to-have |
| 9 | Dark "space" theme matching the pitch deck | P1 | Reuse the deck's purple/navy starfield aesthetic |

---

## 8. Prototype Tech Stack

The production tech stack in the pitch deck (React + FastAPI + PostGIS + PyTorch + Auth0 + Cloudflare + Confidential Computing, etc.) is the right stack for the real product but is far more than a hackathon prototype needs or than an AI app-builder can stand up reliably in one pass. The table below maps each production layer to what the prototype actually uses.

| Layer | Production (pitch deck) | Prototype (this build) | Why |
|---|---|---|---|
| Frontend | React.js, Chart.js, Mapbox GL / Leaflet | React (single component tree), Leaflet + OpenStreetMap, Recharts | Same core choice — Leaflet + OSM needs no API key, ideal for a live demo |
| Backend / API | Python + FastAPI, PostGIS, Redis | None — all state in-memory in the React app; optional tiny mock JSON "API" served from static files | No backend to deploy or debug live on stage |
| Data sources | GEE, Copernicus, NASA Earthdata, USGS, NOAA | Hand-authored mock JSON representing 4-5 regions × 5 hazards | Live satellite APIs need auth/quotas incompatible with a hackathon demo |
| AI / Prediction | PyTorch, XGBoost, SHAP | Deterministic scoring function over mock sensor values (+ optional real LLM call for the NL query box) | Demonstrates the concept without training a model |
| Security layer | Auth0, Cloudflare WAF, SGX, SHA-256 + Merkle trees | Simulated: role switcher, scripted spoof-detection sequence, in-app audit log | Visibly demonstrates the security story without real infra |
| Deployment | Docker, Render, K8s | Single static web app (runs directly in an AI-tool preview / can be zipped and opened locally) | Zero-ops for a hackathon demo |

*Recommended concrete stack for the AI tool to generate: React + Tailwind CSS + Leaflet (react-leaflet) + Recharts + lucide-react icons, all in-memory state, no backend required.*

---

## 9. Prototype Architecture & Data Flow

Single client-side application. No server round-trips except the optional LLM call for the NL query box.

```
[Mock Data Store]  →  [React State / Context]
        |                     |
        v                     v
  [Map View]  <—select—>  [Region Detail Panel]
        |                     |
        v                     v
  [Hazard Filter]      [Response Recommendation]
        |
        v
[Inject Spoofed Data demo]  →  [Simulated Detection]  →  [Audit Log]
        |
        v
  [Role Switcher]  →  gates: Issue Alert / Override Alert / View Only
```

Everything below the mock data store is fully client-side; refreshing the page resets state (acceptable for a demo, call this out to judges if asked).

---

## 10. Mock Data Specification

Ship the prototype with a single hand-authored JSON object (or JS constants file) so it renders immediately with no setup. Suggested shape:

```js
const regions = [
  {
    id: "kali-basin",
    name: "Kali River Basin",
    lat: 21.15, lng: 79.09,
    hazards: {
      flood:     { probability: 0.82, severity: "High",   signals: ["SAR inundation +34%", "IMERG rainfall > 90th pct"] },
      landslide: { probability: 0.21, severity: "Low",    signals: ["Soil saturation nominal"] },
      wildfire:  { probability: 0.05, severity: "Low",    signals: ["NDVI stable"] }
    },
    recommendation: "Evacuate low-lying wards near river km 12-18; stage boats at Sector 4",
  },
  // 4-5 total regions covering different hazard mixes
];

const spoofDemo = {
  region: "kali-basin",
  fakeTile: { hash: "a1F9...", claimedInundation: "12%", actualInundation: "46%" },
  detectionSteps: [
    "Checking file hash against manifest…  MISMATCH",
    "Cross-checking against IMERG rainfall record…  IMPLAUSIBLE",
    "Rejecting tile, restoring last verified SAR pass…",
    "Forensic report generated and logged"
  ]
};
```

Keep numbers internally consistent (e.g. a region flagged "High" flood risk should show rising rainfall + inundation signals) so the demo reads as coherent rather than random.

---

## 11. UI / Screen Specifications

### 11.1 Header / Nav

- App name + "Team Meowiess · NextGen Hack 2026" badge, matching the deck's space/purple theme.
- Role switcher pill (Analyst / Coordinator / Administrator) — top right.

### 11.2 Main dashboard (default view)

- Left: interactive map (Leaflet) with a marker per region, coloured by highest-severity hazard (green/amber/red).
- Top bar: hazard-type filter chips (All / Flood / Wildfire / Landslide / Cyclone / Drought).
- Right: Region Detail panel — appears when a marker is clicked. Shows per-hazard probability bars, severity tag, driving signals as a bullet list, and a "Recommended Response" callout.

### 11.3 Cybersecurity demo panel

- A distinct card/section: "Simulate a spoofed satellite tile" button.
- On click, step through the detectionSteps sequence with a short delay between each line (or a manual "Next" control) so the audience can follow it live.
- End state clearly shows: tile rejected, authentic data restored, forensic entry added to the audit log.

### 11.4 Audit log panel

- Reverse-chronological list: timestamp, actor role, action ("Queried Kali River Basin", "Blocked spoofed SAR tile", "Issued public flood alert").
- Issuing/overriding an alert is only enabled for the Administrator role — attempting it as Analyst shows a disabled state with a tooltip explaining why (this is the RBAC demo).

### 11.5 Natural-language query box

- Placeholder text: "e.g. flag river basins with rising SAR inundation and rainfall above the 90th percentile".
- Canned mode: a small keyword-matcher maps input to one of the mock regions and filters the map to it.
- Stretch goal: send the query + the mock region summaries to a real LLM call and let it pick/explain the match.

---

## 12. Demo Script (Judging Walkthrough)

This mirrors the "Demonstration" scenario from the pitch deck and should be the presenter's script.

1. Open on the dashboard. Select the Kali River Basin marker ahead of monsoon season — show the fused flood-risk view: SAR inundation, IMERG rainfall, elevation, and optical layers driving an 82% flood probability, High severity.
2. Point out the recommended evacuation corridor and staging coordinates generated from that score.
3. Switch to the Cybersecurity panel. Click "Simulate a spoofed satellite tile" — a manipulated SAR tile claiming a much lower inundation level is injected.
4. Walk through the detection sequence live: hash/metadata mismatch detected → cross-checked as physically implausible against the rainfall record → tile blocked → authentic data restored → forensic report logged.
5. Switch role to Analyst and attempt to issue a public alert — show it's disabled, then switch to Administrator and issue it, demonstrating RBAC.
6. Open the Audit Log and show the full trail: the query, the blocked spoof attempt, and the issued alert, each attributed to a role and timestamp.
7. Close with the natural-language query box to show the cross-modal query concept, then gesture to Section 5/16 for the full production vision (real satellite feeds, orbital compute) as "where this goes next."

---

## 13. Non-Functional Requirements (Prototype)

| Requirement | Target for the prototype |
|---|---|
| Load time | Dashboard interactive within ~2 seconds on a typical laptop; no network calls required to render the base demo. |
| Reliability | Must work fully offline / without external API keys for the core demo path (map tiles via OSM are the only external dependency). |
| Responsiveness | Usable on a laptop screen at minimum; mobile layout is a bonus, not a requirement. |
| Visual consistency | Reuse the pitch deck's dark navy/purple space theme so the prototype visually matches the slides. |
| Resilience of the demo | The spoof-detection sequence and role gating must be scripted/deterministic — never dependent on a flaky external call during the live pitch. |

---

## 14. Success Metrics & Judging Alignment

- Judges can see, within 60 seconds, a region, a fused multi-sensor risk score, and a recommended action — validating the core "multi-hazard prediction" pitch.
- Judges can see, within another 60 seconds, a simulated attack being detected and blocked — validating the "security is core, not bolted on" differentiator.
- Judges can see role-gated actions and an audit trail — validating the governance/accountability story for public-safety alerts.
- No crashes, blank states, or dependency on live external services during the demo.

---

## 15. AI Build Instructions — Ready-to-Paste Prompt

Paste the block below into an AI app-building tool (Claude, Lovable, v0, bolt.new, Replit AI, Cursor, etc.). It is self-contained and encodes the scope from Sections 6-12 so the tool builds the prototype, not the full production system.

```
Build a single-page React + Tailwind CSS web app called
"Multi-Hazard Disaster Prediction — Prototype" for a hackathon demo.
This is a UI PROTOTYPE ONLY: no backend, no real satellite APIs,
no real ML models, no real auth or crypto. All data is mocked and
lives in React state/constants. Everything must run and look
complete with zero configuration and no API keys except the
public OpenStreetMap map tiles.

THEME: Dark space theme — navy/purple gradient background (#1B2340
to #2C1F4A), subtle stars, white/lavender text, purple accent
(#6C4FD6) for buttons and highlights. Header shows the app name
and a 'Team Meowiess · NextGen Hack 2026' badge.

LAYOUT:
1. Header: app title, team badge, and a Role switcher pill
   (Analyst / Coordinator / Administrator) that changes which
   actions are enabled elsewhere in the app.
2. Hazard filter chips: All / Flood / Wildfire / Landslide /
   Cyclone / Drought.
3. Main area, two columns:
   LEFT: a Leaflet map (react-leaflet + OpenStreetMap tiles,
   no API key) centered on India, with 5 markers for mock
   regions. Marker colour = green/amber/red based on that
   region's highest-severity hazard for the current filter.
   RIGHT: a Region Detail panel that appears when a marker is
   clicked, showing: region name, a probability bar + severity
   tag per hazard, a bullet list of 'driving signals' (e.g.
   'SAR inundation +34%', 'IMERG rainfall > 90th percentile'),
   and a 'Recommended Response' callout box (evacuation zone /
   staging coordinates).
4. A natural-language query input above the map:
   placeholder 'e.g. flag river basins with rising SAR
   inundation and rainfall above the 90th percentile'. On
   submit, keyword-match against the mock regions and pan/
   select the best match on the map (simple string matching
   is fine — no real NLP required).
5. A 'Cybersecurity Integrity Demo' card with a button
   'Simulate a spoofed satellite tile'. When clicked, run a
   scripted, animated sequence of 4 steps, each appearing
   ~800ms apart:
     (1) 'Checking file hash against manifest... MISMATCH'
     (2) 'Cross-checking against rainfall record... IMPLAUSIBLE'
     (3) 'Rejecting tile, restoring last verified SAR pass...'
     (4) 'Forensic report generated and logged.'
   End state: a clear success banner 'Spoofed data blocked —
   authentic data restored' and a new entry appended to the
   audit log (see below).
6. An Audit Log panel: reverse-chronological list of
   { timestamp, role, action } entries. Seed it with 2-3
   entries on load. Append a new entry whenever: a region is
   queried, the spoof demo completes, or an alert is issued.
7. An 'Issue Public Alert' button on the Region Detail panel.
   Enabled ONLY when Role = Administrator; for other roles
   show it disabled with a tooltip 'Requires Administrator
   role'. Clicking it (as Administrator) shows a confirmation
   toast and logs the action to the Audit Log.

MOCK DATA: Hardcode 5 Indian regions (e.g. a river basin, a
forested hill district, a coastal cyclone-prone district, a
drought-prone district, a landslide-prone hill town) each with
lat/lng and probability+severity+signals for at least 2 hazard
types, plus one recommended response string. Keep numbers
internally consistent (a 'High' flood region should show rising
rainfall/inundation signals, not contradictory ones).

TECH: React (functional components + hooks), Tailwind CSS,
react-leaflet + leaflet for the map, lucide-react for icons.
No backend, no database, no login system — role is just a
piece of UI state. Everything must work after a single load
with no environment variables required.

Do not build: real satellite data ingestion, real authentication,
real encryption/hashing, a trained ML model, or mobile apps.
This is a click-through demo prototype for a hackathon pitch.
```

### 15.1 If the tool supports a real LLM call (stretch goal)

Optionally extend the natural-language query box to call the Anthropic Messages API directly from the client — send the query plus the mock region summaries as context, and ask the model to return which `region_id` best matches and a one-line justification, parsed as JSON. Fall back to the keyword matcher if the call fails, so the demo never breaks on stage.

### 15.2 Handoff checklist before presenting

- Click through all 5 regions and confirm the detail panel renders sensibly for each.
- Run the spoof demo at least twice to confirm timing feels right for a live audience.
- Test the role switcher gates the Issue Alert button correctly in all three roles.
- Confirm the app loads with no console errors and no required API keys.
- Have a one-line answer ready for "is this using real satellite data?" — no, this is a UI prototype with mocked data standing in for the fused sensor pipeline described in the PRD; see Section 5 for the production data plan.

---

## 16. Appendix: Full Production Tech Stack (Future Reference)

Reproduced from the pitch deck for completeness — this is the target stack for the real product, beyond the hackathon prototype.

| Layer | Technologies |
|---|---|
| Frontend | React.js, Chart.js, Mapbox GL (Leaflet for prototyping) |
| Backend | Python + FastAPI, PostGIS, Redis |
| Data Processing & Fusion | rasterio, rioxarray, xarray, geopandas, shapely, numpy, pandas |
| Data Sources & Ingestion | Google Earth Engine, Copernicus Data Space, NASA Earthdata, USGS Earth Explorer, NOAA Open Data, FastAPI ingestion service |
| AI & Prediction Layer | XGBoost / LightGBM (tabular), PyTorch U-Net (raster segmentation), SHAP (explainability), Claude/Gemini API (NL query parsing) |
| Security Layer | Auth0 (zero-trust RBAC), Cloudflare WAF + DDoS, SGX confidential computing, SHA-256 + Merkle trees, PostGIS audit middleware, Prometheus + Grafana, TLS 1.3 |
| Deployment & DevOps | Docker + Docker Compose, Render / Kubernetes, GitHub |

*Future roadmap items (not in scope for the hackathon prototype or its first production release): ground-verification drones, hyperlocal IoT sensor fusion, SMS/IVR last-mile alerts, integration with NDMA/IMD/NGOs for verified public warnings, an open data-fusion API for agriculture/mining/insurance/urban planning, transformer/GNN cross-hazard models, federated learning across regions, blockchain audit trails, and an orbital AI data center for in-space inference.*