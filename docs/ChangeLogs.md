# Change log

## 2026-11-24 - Preserve map labels and tiles during theme changes

- Insert ward and zone boundaries below basemap symbol labels so zone graphics no longer obscure locality names.
- Preserve unchanged vector/raster basemap sources through theme style diffs to reuse tile data, and ignore map clicks while style transitions temporarily remove interactive layers.

## 2026-11-24 - Theme switching and mobile map controls

- Preserve the loaded ward and zone GeoJSON sources and overlay layers across basemap theme changes, register style readiness before swapping, and ignore stale callbacks so overlays remain visible without refetching or reparsing boundary data.
- Reflow mobile header controls into a contained two-row layout so Return to Chennai remains visible.
- Fit the ward extent inside the viewport area not covered by the header or ward card when returning to Chennai.

## 2026-11-24 - Fix map canvas sizing after lazy loading

- Restored explicit full-shell positioning and dimensions for the MapLibre canvas container. Its asynchronously loaded stylesheet had overridden the app's lower-specificity canvas rule, collapsing the map area to zero height while leaving surrounding UI visible.

## 2026-11-24 - Initial-load and navigation performance

- Split the React map feature and MapLibre runtime into lazy-loaded application chunks.
- Deferred all four static authority JSON datasets until the first ward is selected and cached the loaded records.
- Added ward and zone setup at basemap `style.load` instead of waiting for the basemap's full `load` event.
- Added a documented Chennai-periphery navigation envelope covering Chennai and the immediate Chengalpattu, Kanchipuram, and Tiruvallur context, with constrained pan and zoom.
- Theme changes now update the basemap style and reapply ward/zone layers without recreating the MapLibre map instance.

## 2026-11-09 — Rendering performance optimization and professional icon polish

- Optimized map hover event handling: transitioned from full-canvas mousemove and synchronous `queryRenderedFeatures` to layer-targeted event listener (`map.on('mousemove', WARD_FILL_LAYER_ID)`) with `requestAnimationFrame` batching and early returns.
- Eliminated GPU line re-tessellation lag: fixed ward boundary `line-width` to a constant `1.0px` and moved dynamic hover/selection state feedback to GPU-accelerated shader properties (`line-color` and `line-opacity`).
- Removed costly `backdrop-filter: blur(...)` compositing overhead across the WebGL map canvas, substituting crisp, lightweight solid semi-translucent backings with `contain: layout style` and hardware acceleration hints.
- Replaced informal emojis across header, switches, contacts, and avatar fallbacks with sleek, accessible vector SVG icons (`CivicLogoIcon`, `SunIcon`, `MoonIcon`, `ResetViewIcon`, `PhoneIcon`, `MailIcon`, `AvatarSilhouette`).
- Replaced emoji indicators on language switch with clean textual uppercase locale pills (`EN` / `தமிழ்`).


## 2026-10-31 — Bilingual Tamil and English support

- Enabled permanent dual-language place and region labels on the vector basemap (English on primary line, Tamil directly below).
- Added Noto Sans Tamil typography via Google Fonts and integrated it into the global CSS font-family cascade.
- Added a header language toggle button (English / தமிழ்) with persistent localStorage state.
- Localized all UI text across header, counters, buttons, empty states, and ward cards (including GCC 15 zone names in Tamil).

## 2026-10-31 — Ward card streamlining and layout consistency

- Removed the dismiss close button from the ward card in favour of direct map/ward click navigation.
- Unified the ward title into a single concise header line: Ward [ID] [LocalityName].
- Restored councillor photo to a 50% border-radius circular avatar.
- Removed redundant bottom horizontal bars to ensure clean, unobstructed vertical navigation.

## 2026-10-31 — Header and footer dimensional scaling & theme toggle integration

- Scaled header bar height to 7rem (2x) and footer bar height to 4.375rem (1.75x) with adjusted padding.
- Re-anchored the floating selected-ward panel and map status indicator to maintain clean offsets and prevent visual overlap.
- Integrated persistent light/dark theme toggle into the top navigation header bar alongside brand identity and search placeholder.
- Updated responsive rules for mobile viewports maintaining proportionate bar sizing.

## 2026-10-29 — Standardised Montserrat typography across app and map layers

- Configured Google Fonts preconnect and Montserrat font weights (300 to 900) in index.html.
- Updated base global root styles in index.css to default to Montserrat across all UI elements, cards, and buttons.
- Dynamically updated basemap vector style glyphs stack to OpenMapTiles Montserrat PBF glyphs, ensuring map place names, roads, and regions render in Montserrat.
- Noted in project documentation that Montserrat is the current baseline typeface and will be iterated in future milestones.

## 2026-10-29 — Redesigned ward card with clean civic hierarchy

- Replaced the flat-text layout with structured visual tiers for instant readability (Hero identifier -> Elected Councillor -> Zone Admin -> Assembly & MLA).
- Added direct action contact pills (call and email) with phone-number formatting for councillors.
- Designed compact two-column tiles for Zonal Administration (Committee Chairman & Zonal Officer).
- Formatted Assembly Constituency and MLA as a dedicated legislative record with clear party and AC badges.
- Retained full fidelity of verified data without guessing or inventing unconfirmed details.

## 2026-10-29 — Vector basemap with dark theme and high-detail road rendering

- Replaced raster tiles with OpenFreeMap Dark Vector Map style (zero API keys, zero watermarks).
- Enabled complete vector rendering of roads, highways, secondary streets, water bodies, and building footprints at all zoom levels.
- Recalibrated ward polygons with translucent cool-dark fills to ensure street-level details and road grids show through clearly.
- Enhanced zone boundaries with a dual-layer treatment: a dark casing underlay and a high-visibility dash-pattern cyan-teal line (#00e5c8) for unmistakable demarcation of GCC zones.
- Updated map shell, brand banner, and cards with dark translucent styling and backdrop blur.

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

## 2026-10-29 — Unified map theme and graphical zone boundaries

- Switched the default raster basemap from standard OpenStreetMap tiles to Carto Voyager (no labels), eliminating default yellow tinting in favour of a clean, neutral, restrained canvas.
- Updated ward fill and stroke styling to a single-theme palette:
  - Deep teal (`#005954`) for selected ward.
  - Mid teal (`#1d827b`) for hover interactions.
  - Pale blue-green / cool gray (`#d8ebe7`) for neutral ward fills.
  - Darker teal (`#003834`) for boundary strokes.
- Added topological zone-boundary generation via `scripts/build-zone-boundaries.mjs`, deriving clean boundary linestrings between GCC zones directly from canonical ward geometries without modifying raw source data.
- Added a dedicated zone boundary overlay layer (`gcc-zones-outline`) with darker, theme-harmonised lines (`#003834`, width 2.4px) distinguishing GCC zones.
- Updated documentation in `docs/Context.md` and `docs/Architecture.md`.


- Connected the selected-ward panel to the browser-ready ward, councillor, zone, and Assembly Constituency JSON datasets.
- Added candidate-label asterisks, councillor status/contact/photo display, zone committee chairman and Zonal Officer details, and MLA records where a ward-to-AC link exists.
- Kept the map usable if authority JSON fails to load, and made unmapped Assembly links explicit instead of guessing.
- Production build completed successfully; Vite reports the existing large JavaScript chunk warning.
