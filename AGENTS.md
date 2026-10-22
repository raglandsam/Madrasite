# Madrasite repository guidance

Read `docs/Context.md` and `docs/Architecture.md` before changing product code.

## Current milestone

Build only the interactive Chennai ward map. Do not add issue reporting, accounts, dashboards, authority data, or a backend until the project documentation explicitly expands the scope.

## Data rules

- GCC's 2025 Feature Service is the primary ward-boundary source.
- Keep source extracts, validated canonical data, and browser rendering data separate.
- Never replace a source export with simplified geometry.
- Do not invent civic, ward, or councillor data.

## Change discipline

- Keep changes small and focused.
- Update `docs/ChangeLogs.md` for material user-visible, architectural, or data-pipeline changes.
- Keep configuration and source URLs out of component bodies.

- Read the project docs before making changes.
- Keep scope aligned to the current approved milestone.
- Do not silently change architecture, data sources, or product scope.
- Record material decisions and implementation changes in `docs/ChangeLogs.md`.
- Run the applicable verification before declaring work complete.
- Ask the user to enable high consumption before substantial, resource-intensive,
  high-depth implementation, architecture, visual-polish, or robustness work.