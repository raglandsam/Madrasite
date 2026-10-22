# Data scripts

This folder will contain small, repeatable Node scripts for GCC ward data extraction and validation.

Planned scripts:

- `extract-wards.mjs` — inspect and download the GCC Feature Service data.
- `validate-wards.mjs` — check feature count, identifiers, geometry types, coordinate ranges, and duplicate IDs after reprojection.

Do not add a database dependency to these scripts. The map prototype uses validated static geometry first.
