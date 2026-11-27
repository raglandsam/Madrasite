import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { roundFeatureCollectionToSixDecimals } from './geometry-utils.mjs'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const canonicalWardsPath = resolve(repositoryRoot, 'data/wards/canonical/gcc-ward-boundaries-2025.geojson')
const canonicalZonesPath = resolve(repositoryRoot, 'data/wards/canonical/gcc-zone-boundaries-2025.geojson')
const browserZonesPath = resolve(repositoryRoot, 'app/public/data/wards/chennai-zones.json')

function ptKey(point) {
  return `${point[0].toFixed(7)},${point[1].toFixed(7)}`
}

function edgeKey(p1, p2) {
  const k1 = ptKey(p1)
  const k2 = ptKey(p2)
  return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`
}

async function buildZoneBoundaries() {
  const wardsRaw = await readFile(canonicalWardsPath, 'utf8')
  const wards = JSON.parse(wardsRaw)

  const segmentMap = new Map()

  for (const feature of wards.features) {
    const zone = String(feature.properties.zone ?? '').trim()
    const geom = feature.geometry
    const rings =
      geom.type === 'Polygon'
        ? geom.coordinates
        : geom.type === 'MultiPolygon'
          ? geom.coordinates.flat(1)
          : []

    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i]
        const p2 = ring[i + 1]
        const k = edgeKey(p1, p2)
        if (!segmentMap.has(k)) {
          segmentMap.set(k, { count: 0, zones: new Set(), p1, p2 })
        }
        const entry = segmentMap.get(k)
        entry.count++
        entry.zones.add(zone)
      }
    }
  }

  // Build adjacency graph for segments that divide two different zones or form the outer city boundary
  const adj = new Map()

  for (const [, v] of segmentMap.entries()) {
    if (v.zones.size > 1 || v.count === 1) {
      const k1 = ptKey(v.p1)
      const k2 = ptKey(v.p2)
      if (!adj.has(k1)) adj.set(k1, [])
      if (!adj.has(k2)) adj.set(k2, [])
      adj.get(k1).push({ to: k2, pt: v.p2, orig: v.p1 })
      adj.get(k2).push({ to: k1, pt: v.p1, orig: v.p2 })
    }
  }

  const visitedEdges = new Set()
  const multiLine = []

  function walkLine(startKey, firstNeighbor) {
    const ek = startKey < firstNeighbor.to ? `${startKey}|${firstNeighbor.to}` : `${firstNeighbor.to}|${startKey}`
    if (visitedEdges.has(ek)) return
    visitedEdges.add(ek)

    const line = [firstNeighbor.orig, firstNeighbor.pt]
    let curr = firstNeighbor.to
    while (true) {
      const nextNeighbors = adj.get(curr) || []
      if (nextNeighbors.length !== 2) break
      const next = nextNeighbors.find((nxt) => {
        const e = curr < nxt.to ? `${curr}|${nxt.to}` : `${nxt.to}|${curr}`
        return !visitedEdges.has(e)
      })
      if (!next) break
      const e = curr < next.to ? `${curr}|${next.to}` : `${next.to}|${curr}`
      visitedEdges.add(e)
      line.push(next.pt)
      curr = next.to
    }
    multiLine.push(line)
  }

  // First pass: junctions (nodes with degree != 2)
  for (const [k1, neighbors] of adj.entries()) {
    if (neighbors.length !== 2) {
      for (const neighbor of neighbors) {
        walkLine(k1, neighbor)
      }
    }
  }

  // Second pass: closed loops
  for (const [k1, neighbors] of adj.entries()) {
    for (const neighbor of neighbors) {
      walkLine(k1, neighbor)
    }
  }

  const zoneBoundariesGeoJson = {
    type: 'FeatureCollection',
    name: 'chennai_zone_boundaries_2025',
    metadata: {
      source: 'Derived from Greater Chennai Corporation 2025 Ward Boundaries',
      description: 'Zone boundaries computed by topological boundary extraction across GCC zones',
      lineCount: multiLine.length,
      generatedAt: new Date().toISOString(),
    },
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'zone-boundaries',
          type: 'zone-boundary',
        },
        geometry: {
          type: 'MultiLineString',
          coordinates: multiLine,
        },
      },
    ],
  }

  await mkdir(dirname(browserZonesPath), { recursive: true })
  const canonicalOutputJson = JSON.stringify(zoneBoundariesGeoJson)
  const browserOutputJson = JSON.stringify(roundFeatureCollectionToSixDecimals(zoneBoundariesGeoJson))
  await Promise.all([
    writeFile(canonicalZonesPath, canonicalOutputJson),
    writeFile(browserZonesPath, browserOutputJson),
  ])

  console.log(`Generated ${multiLine.length} zone boundary lines.`)
}

await buildZoneBoundaries()
