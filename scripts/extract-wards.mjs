import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirectory = resolve(repositoryRoot, 'data/wards/source')
const canonicalDirectory = resolve(repositoryRoot, 'data/wards/canonical')
const browserDirectory = resolve(repositoryRoot, 'app/public/data/wards')

const serviceUrl = 'https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/2'
const retainedProperties = ['objectid', 'zone_id', 'ward_id', 'ward', 'zone', 'region', 'ac_name', 'ac_no']

function urlFor(path, parameters) {
  const url = new URL(`${serviceUrl}${path}`)
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, String(value))
  }
  return url
}

async function requestJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`)
  }

  const result = await response.json()
  if (result.error) {
    throw new Error(`GIS service error: ${result.error.message ?? JSON.stringify(result.error)}`)
  }

  return result
}

function coordinateBounds(geometry) {
  const bounds = { minLongitude: Infinity, minLatitude: Infinity, maxLongitude: -Infinity, maxLatitude: -Infinity }

  function visit(value) {
    if (typeof value[0] === 'number') {
      const [longitude, latitude] = value
      bounds.minLongitude = Math.min(bounds.minLongitude, longitude)
      bounds.minLatitude = Math.min(bounds.minLatitude, latitude)
      bounds.maxLongitude = Math.max(bounds.maxLongitude, longitude)
      bounds.maxLatitude = Math.max(bounds.maxLatitude, latitude)
      return
    }
    value.forEach(visit)
  }

  visit(geometry.coordinates)
  return bounds
}

function mergeBounds(allBounds, nextBounds) {
  allBounds.minLongitude = Math.min(allBounds.minLongitude, nextBounds.minLongitude)
  allBounds.minLatitude = Math.min(allBounds.minLatitude, nextBounds.minLatitude)
  allBounds.maxLongitude = Math.max(allBounds.maxLongitude, nextBounds.maxLongitude)
  allBounds.maxLatitude = Math.max(allBounds.maxLatitude, nextBounds.maxLatitude)
}

function toCanonicalFeature(feature) {
  const properties = Object.fromEntries(
    retainedProperties.map((property) => [property, feature.properties?.[property] ?? null]),
  )

  // The GCC service performs the EPSG:32644 -> EPSG:4326 transformation via outSR.
  // Drop Z/M values to produce browser-friendly 2D GeoJSON without altering x/y geometry.
  function toTwoDimensions(value) {
    if (typeof value[0] === 'number') return [value[0], value[1]]
    return value.map(toTwoDimensions)
  }

  return {
    type: 'Feature',
    properties,
    geometry: {
      type: feature.geometry.type,
      coordinates: toTwoDimensions(feature.geometry.coordinates),
    },
  }
}

await Promise.all([mkdir(sourceDirectory, { recursive: true }), mkdir(canonicalDirectory, { recursive: true }), mkdir(browserDirectory, { recursive: true })])

const [metadata, featureCount, rawFeatures, reprojectedFeatures] = await Promise.all([
  requestJson(urlFor('', { f: 'pjson' })),
  requestJson(urlFor('/query', { where: '1=1', returnCountOnly: 'true', f: 'json' })),
  requestJson(urlFor('/query', {
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '32644',
    f: 'json',
  })),
  requestJson(urlFor('/query', {
    where: '1=1',
    outFields: retainedProperties.join(','),
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  })),
])

if (metadata.spatialReference?.wkid !== 32644) {
  throw new Error(`Expected GCC source EPSG:32644, received EPSG:${metadata.spatialReference?.wkid ?? 'unknown'}`)
}

if (rawFeatures.features.length !== featureCount.count || reprojectedFeatures.features.length !== featureCount.count) {
  throw new Error(`Feature count mismatch: service=${featureCount.count}, raw=${rawFeatures.features.length}, reprojected=${reprojectedFeatures.features.length}`)
}

const canonicalFeatures = reprojectedFeatures.features.map(toCanonicalFeature)
const invalidFeatures = canonicalFeatures.filter((feature) => !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))
if (invalidFeatures.length > 0) {
  throw new Error(`Expected only Polygon or MultiPolygon geometry; found ${invalidFeatures.length} invalid feature(s).`)
}

const wardIds = canonicalFeatures.map((feature) => String(feature.properties.ward_id ?? '').trim())
const missingWardIds = wardIds.filter((wardId) => wardId.length === 0)
const duplicateWardIds = [...new Set(wardIds.filter((wardId, index) => wardIds.indexOf(wardId) !== index))]
if (missingWardIds.length > 0 || duplicateWardIds.length > 0) {
  throw new Error(`Ward identifier validation failed: missing=${missingWardIds.length}, duplicate=${duplicateWardIds.join(', ') || 'none'}`)
}

const bounds = { minLongitude: Infinity, minLatitude: Infinity, maxLongitude: -Infinity, maxLatitude: -Infinity }
canonicalFeatures.forEach((feature) => mergeBounds(bounds, coordinateBounds(feature.geometry)))

if (bounds.minLongitude < 70 || bounds.maxLongitude > 90 || bounds.minLatitude < 5 || bounds.maxLatitude > 25) {
  throw new Error(`Coordinates do not fall within the expected Chennai region: ${JSON.stringify(bounds)}`)
}

const retrievedAt = new Date().toISOString()
const canonical = {
  type: 'FeatureCollection',
  name: 'gcc_ward_boundaries_2025',
  metadata: {
    source: serviceUrl,
    sourceSpatialReference: 'EPSG:32644',
    spatialReference: 'EPSG:4326',
    retrievedAt,
    featureCount: canonicalFeatures.length,
    retainedProperties,
  },
  features: canonicalFeatures,
}

const report = {
  retrievedAt,
  serviceUrl,
  layer: { id: metadata.id, name: metadata.name, geometryType: metadata.geometryType },
  sourceSpatialReference: 'EPSG:32644',
  canonicalSpatialReference: 'EPSG:4326',
  featureCount: canonicalFeatures.length,
  uniqueWardIds: new Set(wardIds).size,
  geometryTypes: [...new Set(canonicalFeatures.map((feature) => feature.geometry.type))],
  bounds,
  retainedProperties,
  validation: { missingWardIds: missingWardIds.length, duplicateWardIds },
}

await Promise.all([
  writeFile(resolve(sourceDirectory, 'gcc-ward-boundaries-2025-esri-32644.json'), JSON.stringify(rawFeatures)),
  writeFile(resolve(sourceDirectory, 'gcc-ward-boundaries-2025-metadata.json'), JSON.stringify(metadata, null, 2)),
  writeFile(resolve(canonicalDirectory, 'gcc-ward-boundaries-2025.geojson'), JSON.stringify(canonical)),
  writeFile(resolve(repositoryRoot, 'data/wards/validation-report.json'), JSON.stringify(report, null, 2)),
  writeFile(resolve(browserDirectory, 'chennai-wards.geojson'), JSON.stringify(canonical)),
])

console.log(`Imported and validated ${canonicalFeatures.length} GCC wards.`)
console.log(`Canonical bounds: ${bounds.minLongitude}, ${bounds.minLatitude} to ${bounds.maxLongitude}, ${bounds.maxLatitude}`)
