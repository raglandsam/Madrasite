# Madrasite map application

The first Madrasite milestone is an interactive Chennai ward map. It intentionally excludes civic reporting, backend services, accounts, dashboards, and fabricated data.

## Run locally

```powershell
npm install
npm run dev
```

## Repository guidance

Read the repository-level `../AGENTS.md`, `../docs/Context.md`, and `../docs/Architecture.md` before making product changes.

## Map data

Validated browser-ready ward geometry will be stored under `public/data/wards/`. Its source and canonical forms live outside this app in `../data/wards/`.
