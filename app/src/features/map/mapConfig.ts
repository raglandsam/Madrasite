export const MAP_CONFIG = {
  // This temporary neutral viewport will be replaced by bounds derived from
  // validated GCC ward geometry.
  fallbackCenter: [80.2707, 13.0827] as const,
  fallbackZoom: 10,
  basemapStyleUrl: import.meta.env.VITE_BASEMAP_STYLE_URL ?? '',
} as const
