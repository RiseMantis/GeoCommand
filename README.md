# 🛰️ Multi-Hazard Disaster Prediction & Early-Warning Platform

*Cross-modal satellite data fusion for predicting floods, wildfires, landslides, cyclones, and droughts — before they happen.*

Built by **Team Meowiess** for **NextGen Hack 2026** (Domain: Space Tech)

---

## Why we built this

Disasters are happening more often, and they're getting harder to predict with any single data source. Satellite data is the best tool we have — but it's scattered across a dozen different agencies and sensor types, none of which tell the full story alone.

So we built a platform that pulls all of it together — optical, radar, thermal, rainfall, soil moisture, and elevation data — into one aligned view of a region, and uses that to predict five different hazards before they escalate.

There's a second problem we cared just as much about: a disaster alert is only useful if people can trust it. A spoofed alert causes panic. A suppressed real one costs lives. So security isn't an afterthought here — it's built into every step of the pipeline, from the moment satellite data comes in to the moment an alert goes out.

---

## What it actually does

- Fuses six types of satellite data into a single, aligned picture of a region
- Detects early precursor signals for floods, wildfires, landslides, cyclones, and droughts
- Scores each region by hazard probability and expected severity
- Generates interactive risk heatmaps that update as new satellite data comes in
- Recommends evacuation zones, safe corridors, and staging points for response teams
- Verifies every piece of incoming data and every model prediction before it's trusted
- Logs everything, so any alert can be traced back to exactly what data and model produced it

---

## How it works

```
Satellite / Orbital Node
        ↓
Space Data Center
        ↓
Multi-Sensor Fusion & Cross-Modal Retrieval Engine
        ↓
Multi-Hazard Prediction AI (Flood · Wildfire · Landslide · Cyclone · Drought)
        ↓
Alert Dashboard → Emergency Response Teams / Public Warning Systems
```

1. **Collect** — continuously ingest satellite passes across all sensor types
2. **Align** — correct, georeference, and resample everything to a common grid so a flood signal in one sensor lines up with the terrain and rainfall data for the same spot
3. **Query** — analysts can search by region, hazard, or plain language ("flag basins with rising inundation and rainfall above the 90th percentile")
4. **Predict** — hazard-specific models turn the fused data into a probability and severity score per region
5. **Alert** — the platform outputs a heatmap, a confidence score, response recommendations, and an explanation of which signals drove the alert

---

## Security, baked in

Because we treat alert integrity as a life-safety feature, not a nice-to-have:

- **Data verification** — every incoming satellite file is hash- and metadata-checked before it can influence a prediction
- **Model protection** — models run in hardware-isolated enclaves and are watched for tampering or unusual behavior
- **Access control** — role-based, zero-trust permissions for analysts, coordinators, administrators, and public information officers
- **Threat monitoring** — watches for spoofed sensor data and abnormal query patterns
- **Full audit trail** — every prediction and alert is logged: who accessed what, which models produced it, whether anything was modified

We stress-tested this idea in our demo: a manipulated satellite tile is injected to fake a lower flood level than reality. The system catches the mismatch, cross-checks it against the rainfall record, blocks the tile, restores the real data, and generates a forensic report — all before a bad alert (or a missing one) ever reaches the public.

---

## Tech stack

| Layer | What we used |
|---|---|
| Frontend | React, Mapbox GL / Leaflet, Chart.js |
| Backend | Python, FastAPI, PostGIS, Redis |
| Data & Ingestion | Google Earth Engine, continuous FastAPI ingestion |
| Data Processing | rasterio, rioxarray, xarray, geopandas, numpy, pandas |
| AI & Prediction | XGBoost / LightGBM, PyTorch (U-Net), SHAP, Claude / Gemini API |
| Security | OAuth2 + Auth0, SHA-256 + Merkle Trees, TLS 1.3, Confidential Computing (TEEs), Cloudflare WAF |
| Deployment | Docker, Render, GitHub |

---

## Where the data comes from

We fuse seven categories of satellite and sensor data — optical (Sentinel-2, Landsat), thermal (MODIS, VIIRS), SAR radar (Sentinel-1, ALOS PALSAR), precipitation (GPM IMERG), soil moisture (SMAP), elevation (SRTM DEM), and atmospheric data (NOAA GOES, INSAT-3D). Each one covers a different piece of the puzzle — no single sensor can predict a hazard on its own.

---

## What's next

- Ground-level drones for active verification of high-confidence alerts
- A mobile app with SMS/IVR fallback for low-connectivity areas
- Official integration with NDMA, IMD, and NGOs
- Opening the fusion pipeline as an API for agriculture, mining, and insurance use cases
- Moving core inference onto satellites themselves — an orbital AI data center — so alerts don't have to wait on a ground-processing bottleneck

---

## Team Meowiess

Shreya Wanjari · Mukund Chaurasiya · Neel Sankhe

*NextGen Hack 2026 — Space Tech*