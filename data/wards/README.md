# Ward boundary data

This directory deliberately separates three forms of the Chennai ward geometry.

- `source/` holds unmodified downloads from the Greater Chennai Corporation GIS Feature Service.
- `canonical/` holds the validated EPSG:4326 GeoJSON reference export.

Browser-optimised copies belong in `app/public/data/wards/` and must be generated from the canonical export. They are not the authoritative dataset.

Before adding a dataset, record its Feature Service query URL, retrieval time, coordinate reference system, feature count, retained attributes, and validation results in this file or a linked extraction log.

## Refresh

From the repository root, run:

```powershell
node scripts/extract-wards.mjs
```

The script writes a validation report to `validation-report.json` and fails if ward identifiers are missing or duplicated, feature counts disagree, geometry types are unexpected, or coordinates are outside the Chennai region.
