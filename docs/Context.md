# Madrasite — product context

## Current objective

Madrasite is a Chennai-focused civic mapping project. The immediate milestone is a polished, interactive map that renders verified Greater Chennai Corporation ward boundaries and prepares a selected-ward card for source-backed ward and representative data. Static datasets are connected to the selected-ward card; the next data task is to obtain an authoritative crosswalk for the 92 wards that lack a GCC ward-to-Assembly link.

## In scope now

- Interactive MapLibre GL JS map of Chennai.
- Official ward-boundary extraction, reprojection, validation, and rendering.
- Source-backed static ward, zone, councillor, Zonal Officer, Assembly Constituency, and MLA datasets displayed in the selected-ward card.
- Zoom, pan, return-to-Chennai control, hover, selection, and a small verified-attribute panel.
- Responsive, map-first user interface.

## Explicitly out of scope now

- Civic issue reporting, resolution tracking, dashboards, analytics, and administration.
- Live runtime scraping, accounts, authentication, backend APIs, databases, and AI.
- Road display layers unless a later decision explicitly requires them.

## Data source

The primary source is GCC's 2025 Feature Service:

`https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/layers`

Ward boundaries are layer `2` (`EDP_wardBoundary_2025`). The service reports EPSG:32644; browser GeoJSON must be genuinely reprojected to EPSG:4326, never merely relabelled.

## Product principles

1. Correct official boundary data before visual polish.
2. Map-first and uncluttered interface.
3. Show confirmed attributes with their source; visibly mark candidate locality labels and never present them as confirmed ward-unit names.
4. Keep future layers independent from the ward layer.
5. Optimise only after measuring actual GeoJSON performance.



