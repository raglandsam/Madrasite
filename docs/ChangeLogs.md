# Change log

## 2026-10-21 — Map foundation initialised

- Established the map-only MVP scope and data-handling rules.
- Added the repository data-pipeline folders for source and canonical ward geometry.
- Added the initial frontend map feature structure and configurable map settings.
- No civic issue, reporting, backend, or fabricated data functionality was added.

## 2026-10-21 — Repeatable ward-boundary ingestion added

- Added a Node-based extraction and validation script for GCC Feature Service layer 2.
- The workflow preserves an EPSG:32644 source response, requests a real server-side EPSG:4326 transformation, then produces canonical and browser-ready GeoJSON.
