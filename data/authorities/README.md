# Authority data

The authority datasets are for the future ward-card display. They are static snapshots, not runtime API calls.

- source/ contains the raw GCC pages, GCC ward layer, ECI results report, and project-owner-supplied candidate name list.
- canonical/ contains generated structured JSON plus a generation summary.
- app/public/data/authorities/ contains the corresponding browser-ready copies.

Regenerate with node scripts/build-authority-data.mjs from the repository root. Review every update before publishing.

Current confidence rules:
- Ward zone memberships from GCC 2025 are confirmed.
- Each ward name has a nameConfirmed enum (yes or no) and a nameStatus. All supplied labels are currently nameConfirmed: no, so the UI should append an asterisk.
- Councillor status is active, vacant, or unknown; unknown is never treated as vacant.
- Zone committee chairman and Zonal Officer are different roles.
- Ward-to-AC links are confirmed only when supplied in GCC's 2025 ward GIS layer. Blank GCC attributes remain unmapped pending an official crosswalk.

See docs/WARD_AND_AUTHORITY_DATA.md for sources, counts, schema behavior, and known gaps.

