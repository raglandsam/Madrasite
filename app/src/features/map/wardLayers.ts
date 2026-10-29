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

  map.addLayer({
    id: WARD_FILL_LAYER_ID,
    type: 'fill',
    source: WARD_SOURCE_ID,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#005954', // Deep teal for selection
        ['boolean', ['feature-state', 'hover'], false],
        '#1d827b', // Mid teal for hover
        '#d8ebe7', // Pale blue-green / cool gray neutral fill
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.7,
        ['boolean', ['feature-state', 'hover'], false],
        0.52,
        0.3,
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
        '#003834', // Deepest contrast border for selected ward
        ['boolean', ['feature-state', 'hover'], false],
        '#0a5852',
        '#7ca59f', // Subtle restrained ward boundary line
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2.4,
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

  map.addLayer({
    id: ZONE_OUTLINE_LAYER_ID,
    type: 'line',
    source: ZONE_SOURCE_ID,
    paint: {
      'line-color': '#003834', // Darker teal border blending with the theme
      'line-width': 2.4,
      'line-opacity': 0.85,
    },
  })
}

