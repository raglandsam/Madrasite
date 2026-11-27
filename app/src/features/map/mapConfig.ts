export type MapThemeMode = 'dark' | 'light'

export const MAP_CONFIG = {
  fallbackCenter: [80.2707, 13.0827] as const,
  fallbackZoom: 10,
  wardDataUrl: '/data/wards/chennai-wards.json',
  zoneDataUrl: '/data/wards/chennai-zones.json',
  wardSourceUrl: 'https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/2',
  authorityDataUrls: {
    wards: '/data/authorities/ward-profiles.json',
    councillors: '/data/authorities/councillor-profiles.json',
    zones: '/data/authorities/zone-profiles.json',
    assemblies: '/data/authorities/assembly-constituencies.json',
  },
  basemapStyles: {
    dark: import.meta.env.VITE_BASEMAP_STYLE_URL_DARK?.trim() || 'https://tiles.openfreemap.org/styles/dark',
    light: import.meta.env.VITE_BASEMAP_STYLE_URL_LIGHT?.trim() || 'https://tiles.openfreemap.org/styles/positron',
  },
  basemapStyleUrl:
    import.meta.env.VITE_BASEMAP_STYLE_URL?.trim() || 'https://tiles.openfreemap.org/styles/dark',
  basemapTileUrl:
    import.meta.env.VITE_BASEMAP_TILE_URL?.trim() ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  basemapAttribution:
    import.meta.env.VITE_BASEMAP_ATTRIBUTION?.trim() ||
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>',
} as const
