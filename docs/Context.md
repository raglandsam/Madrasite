# Madrasite — product context

## Current objective

Madrasite is a Chennai-focused civic mapping project. The immediate milestone is a polished, interactive map that renders verified Greater Chennai Corporation ward boundaries and lets a visitor inspect a selected ward.

## In scope now

- Interactive MapLibre GL JS map of Chennai.
- Official ward-boundary extraction, reprojection, validation, and rendering.
- Zoom, pan, return-to-Chennai control, hover, selection, and a small verified-attribute panel.
- Responsive, map-first user interface.

## Explicitly out of scope now

- Civic issue reporting, resolution tracking, dashboards, analytics, and administration.
- Councillor scraping, profiles, or contact information.
- Accounts, authentication, backend APIs, databases, AI, or fabricated seed data.
- Zone or road display layers unless a later decision explicitly requires them.

## Data source

The primary source is GCC's 2025 Feature Service:

`https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/layers`

Ward boundaries are layer `2` (`EDP_wardBoundary_2025`). The service reports EPSG:32644; browser GeoJSON must be genuinely reprojected to EPSG:4326, never merely relabelled.

## Product principles

1. Correct official boundary data before visual polish.
2. Map-first and uncluttered interface.
3. Show only verified attributes supplied by the source.
4. Keep future layers independent from the ward layer.
5. Optimise only after measuring actual GeoJSON performance.
