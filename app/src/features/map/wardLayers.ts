import type { Map as MapLibreMap } from 'maplibre-gl'
import type { WardFeatureCollection } from './wardTypes'

export const WARD_SOURCE_ID = 'gcc-wards'
export const WARD_FILL_LAYER_ID = 'gcc-wards-fill'
export const WARD_OUTLINE_LAYER_ID = 'gcc-wards-outline'

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
        '#0b766f',
        ['boolean', ['feature-state', 'hover'], false],
        '#39a6a0',
        '#7ecac4',
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.56,
        ['boolean', ['feature-state', 'hover'], false],
        0.44,
        0.21,
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
        '#075852',
        ['boolean', ['feature-state', 'hover'], false],
        '#137f78',
        '#2e7771',
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2.4,
        ['boolean', ['feature-state', 'hover'], false],
        1.8,
        1,
      ],
    },
  })
}
