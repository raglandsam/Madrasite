export type WardProperties = {
  objectid: number
  ward_id: string
  ward: string
  zone_id: string
  zone: string
  region: string | null
  ac_name: string | null
  ac_no: string | null
}

export type WardGeometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export type WardFeature = {
  type: 'Feature'
  properties: WardProperties
  geometry: WardGeometry
}

export type WardFeatureCollection = {
  type: 'FeatureCollection'
  features: WardFeature[]
}
