# Madrasite — current architecture

## Repository layout

```text
Madrasite/
├─ AGENTS.md
├─ app/                         # Vite + React + TypeScript frontend
│  ├─ public/data/wards/         # Browser-ready ward geometry
│  └─ src/features/map/          # Map-specific UI and layers
├─ data/wards/
│  ├─ source/                    # Untouched GCC exports
│  └─ canonical/                 # Validated EPSG:4326 GeoJSON
├─ docs/                         # Shared project context and decisions
└─ scripts/                      # Repeatable extraction/validation tooling
```

## Frontend choices

- React and TypeScript via Vite.
- MapLibre GL JS for interactive rendering.
- A configurable basemap style URL, never hard-coded throughout components.
- Local GeoJSON for the first map prototype. MVT/vector tiles are a later performance option, not an initial requirement.

## Map feature boundaries

`src/features/map/` owns map configuration, source-property types, visual layer definitions, and selection UI. It must not contain product logic for future civic reports or backend APIs.

## Data flow

```text
GCC Feature Service
  -> source export (EPSG:32644)
  -> reprojection and validation
  -> canonical GeoJSON (EPSG:4326)
  -> browser-ready GeoJSON
  -> MapLibre ward source and layers
```

Retain identifiers and source attributes needed for selection: ward number/ID, zone ID, ward, zone, region, assembly-constituency name, and assembly-constituency number, when present and verified.

## Authority-data extension (2026-10-25)

Static source-backed JSON datasets have been collected for ward cards. They live in data/authorities/source/ (raw), data/authorities/canonical/ (generated canonical records), and app/public/data/authorities/ (browser-ready copies). scripts/build-authority-data.mjs regenerates the records.

The selected-ward card fetches the browser-ready authority JSON separately from map geometry and indexes records by ward number, zone number, and Assembly Constituency ID. Candidate ward labels carry nameConfirmed: no; the UI appends * at render time. Missing records are shown as missing or pending, not inferred. No database or backend is needed for this snapshot.

Only 108 of 200 ward-to-Assembly links are populated in GCC's 2025 ward layer. Keep other links explicitly unmapped until an official crosswalk is available. See docs/WARD_AND_AUTHORITY_DATA.md.

