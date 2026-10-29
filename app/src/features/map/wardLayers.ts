import type { Map as MapLibreMap } from 'maplibre-gl'
import type { WardFeatureCollection, ZoneBoundaryFeatureCollection } from './wardTypes'

export const WARD_SOURCE_ID = 'gcc-wards'
export const WARD_FILL_LAYER_ID = 'gcc-wards-fill'
export const WARD_OUTLINE_LAYER_ID = 'gcc-wards-outline'

export const ZONE_SOURCE_ID = 'gcc-zones'
export const ZONE_OUTLINE_LAYER_ID = 'gcc-zones-outline'

export function addWardLayers(map: MapLibreMap, data: WardFeatureCollection) {
  map.addSource(WARD_SOURCE_ID, {
    type: 'geojson',
    data,
    promoteId: 'ward_id',
  })

  // Find first label layer to keep labels crisp above the ward polygon fills if desired
  map.addLayer({
    id: WARD_FILL_LAYER_ID,
    type: 'fill',
    source: WARD_SOURCE_ID,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#028478', // Radiant deep teal for selection
        ['boolean', ['feature-state', 'hover'], false],
        '#0f766e', // Vibrant mid teal for hover
        '#11292d', // Dark translucent cool-teal fill (lets streets, roads and water remain visible)
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.58,
        ['boolean', ['feature-state', 'hover'], false],
        0.42,
        0.28,
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
        '#2dd4bf', // Glowing bright teal for selected ward perimeter
        ['boolean', ['feature-state', 'hover'], false],
        '#14b8a6', // Mid-bright teal on hover
        '#1f4749', // Subtle crisp dark-teal boundary between adjacent wards
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2.5,
        ['boolean', ['feature-state', 'hover'], false],
        1.8,
        0.8,
      ],
    },
  })
}

export function addZoneLayers(map: MapLibreMap, data: ZoneBoundaryFeatureCollection) {
  map.addSource(ZONE_SOURCE_ID, {
    type: 'geojson',
    data,
  })

  // Zone border casing / subtle dark halo for maximum contrast over complex road networks
  map.addLayer({
    id: `${ZONE_OUTLINE_LAYER_ID}-casing`,
    type: 'line',
    source: ZONE_SOURCE_ID,
    paint: {
      'line-color': '#061314',
      'line-width': 4.5,
      'line-opacity': 0.7,
    },
  })

  // Prominent distinct zone graphical boundary line
  map.addLayer({
    id: ZONE_OUTLINE_LAYER_ID,
    type: 'line',
    source: ZONE_SOURCE_ID,
    paint: {
      'line-color': '#00e5c8', // High-contrast, theme-matching emerald-teal
      'line-width': 2.6,
      'line-opacity': 0.95,
      'line-dasharray': [3, 1], // Clear distinct graphical pattern for zone demarcation
    },
  })
}

