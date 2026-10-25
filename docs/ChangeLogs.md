# Change log

## 2026-10-21 — Map foundation initialised

- Established the map-only MVP scope and data-handling rules.
- Added the repository data-pipeline folders for source and canonical ward geometry.
- Added the initial frontend map feature structure and configurable map settings.
- No civic issue, reporting, backend, or fabricated data functionality was added.

## 2026-10-21 — Repeatable ward-boundary ingestion added

- Added a Node-based extraction and validation script for GCC Feature Service layer 2.
- The workflow preserves an EPSG:32644 source response, requests a real server-side EPSG:4326 transformation, then produces canonical and browser-ready GeoJSON.

## 2026-10-25 — Councillor-data research brief added

- Added `CURRENT_SETUP_AND_COUNCILLOR_DATA_PLAN.txt`, documenting the current static-only architecture, official GCC council directory research, and a review-first refresh strategy.
- No councillor data, UI, backend, or map-theme change was implemented.

## 2026-10-25 — Static ward and representative data collected

- Added source snapshots and generated canonical/browser-ready JSON for 200 ward profiles, 200 councillor records, 15 zone profiles, and 32 Assembly Constituencies with 2026 ECI winners.
- Ward labels are all marked candidate; GCC 2025 supplies confirmed zone membership for all 200.
- GCC lists 192 active councillors, four explicit vacancies, and four wards without a councillor-labelled entry; 15 zone committee chairmen and 10 Zonal Officers are listed.
- Ward-to-Assembly links are populated for the 108 wards that have GCC ac_no attributes. The other 92 remain explicitly unmapped pending an official crosswalk.
- No ward-card UI, backend, or issue-reporting feature was added.

## 2026-10-25 — Authority data wired into ward cards

- Connected the selected-ward panel to the browser-ready ward, councillor, zone, and Assembly Constituency JSON datasets.
- Added candidate-label asterisks, councillor status/contact/photo display, zone committee chairman and Zonal Officer details, and MLA records where a ward-to-AC link exists.
- Kept the map usable if authority JSON fails to load, and made unmapped Assembly links explicit instead of guessing.
- Production build completed successfully; Vite reports the existing large JavaScript chunk warning.
