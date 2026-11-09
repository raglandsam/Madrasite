import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapThemeMode } from './mapConfig'
import type { WardFeatureCollection, ZoneBoundaryFeatureCollection } from './wardTypes'

export const WARD_SOURCE_ID = 'gcc-wards'
export const WARD_FILL_LAYER_ID = 'gcc-wards-fill'
export const WARD_OUTLINE_LAYER_ID = 'gcc-wards-outline'

export const ZONE_SOURCE_ID = 'gcc-zones'
export const ZONE_OUTLINE_LAYER_ID = 'gcc-zones-outline'

export function addWardLayers(map: MapLibreMap, data: WardFeatureCollection, mode: MapThemeMode = 'dark') {
  if (!map.getSource(WARD_SOURCE_ID)) {
    map.addSource(WARD_SOURCE_ID, {
      type: 'geojson',
      data,
      promoteId: 'ward_id',
    })
  }

  const isLight = mode === 'light'

  map.addLayer({
    id: WARD_FILL_LAYER_ID,
    type: 'fill',
    source: WARD_SOURCE_ID,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        isLight ? '#2f683a' : '#028478', // Deep forest/olive green in light mode, radiant deep teal in dark mode
        ['boolean', ['feature-state', 'hover'], false],
        isLight ? '#52824e' : '#0f766e', // Medium olive/sage in light mode, vibrant mid-teal in dark mode
        isLight ? '#e2ecdf' : '#11292d', // Light mild pale green fill vs dark cool-teal
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        isLight ? 0.62 : 0.58,
        ['boolean', ['feature-state', 'hover'], false],
        isLight ? 0.48 : 0.42,
        isLight ? 0.35 : 0.28,
      ],
    },
  })

  map.addLayer({
    id: WARD_OUTLINE_LAYER_ID,
    type: 'line',
    source: WARD_SOURCE_ID,
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        isLight ? '#194420' : '#2dd4bf', // Dark pine green border on selection in light mode, luminous teal in dark mode
        ['boolean', ['feature-state', 'hover'], false],
        isLight ? '#2e6b37' : '#14b8a6',
        isLight ? '#8ba887' : '#1f4749', // Subtle crisp olive-sage ward boundary
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1.0,
        ['boolean', ['feature-state', 'hover'], false],
        0.95,
        0.65,
      ],
      'line-width': 1.0,
    },
  })
}

export function addZoneLayers(map: MapLibreMap, data: ZoneBoundaryFeatureCollection, mode: MapThemeMode = 'dark') {
  if (!map.getSource(ZONE_SOURCE_ID)) {
    map.addSource(ZONE_SOURCE_ID, {
      type: 'geojson',
      data,
    })
  }

  const isLight = mode === 'light'

  // Zone border casing / subtle halo for high contrast over street networks
  map.addLayer({
    id: `${ZONE_OUTLINE_LAYER_ID}-casing`,
    type: 'line',
    source: ZONE_SOURCE_ID,
    paint: {
      'line-color': isLight ? '#f4f8f2' : '#061314',
      'line-width': 4.5,
      'line-opacity': isLight ? 0.9 : 0.7,
    },
  })

  // Prominent distinct zone graphical boundary line
  map.addLayer({
    id: ZONE_OUTLINE_LAYER_ID,
    type: 'line',
    source: ZONE_SOURCE_ID,
    paint: {
      // In light mode: dark olive-pine green (#1a4320); In dark mode: radiant cyan-teal (#00e5c8)
      'line-color': isLight ? '#1a4320' : '#00e5c8',
      'line-width': 2.6,
      'line-opacity': 0.95,
      'line-dasharray': [3, 1], // Clear distinct graphical pattern for zone demarcation
    },
  })
}

