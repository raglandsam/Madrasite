import { useEffect, useRef, useState } from 'react'
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchWardCardData } from './authorityData'
import type { WardCardData } from './authorityTypes'
import { WardInfoPanel } from './WardInfoPanel'
import { MAP_CONFIG } from './mapConfig'
import { addWardLayers, addZoneLayers, WARD_FILL_LAYER_ID, WARD_SOURCE_ID } from './wardLayers'
import type { WardFeatureCollection, WardProperties, ZoneBoundaryFeatureCollection } from './wardTypes'

setWorkerUrl(workerUrl)

type MapStatus = 'loading' | 'ready' | 'error'
type AuthorityStatus = 'loading' | 'ready' | 'error'
type FeatureId = string | number

async function loadBasemapStyle(signal: AbortSignal): Promise<StyleSpecification | string> {
  const url = MAP_CONFIG.basemapStyleUrl
  if (!url) {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [MAP_CONFIG.basemapTileUrl],
          tileSize: 256,
          attribution: MAP_CONFIG.basemapAttribution,
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    }
  }

  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return url
    const style = (await res.json()) as StyleSpecification
    // Point basemap glyphs to Montserrat PBF fontstack
    style.glyphs = 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    if (Array.isArray(style.layers)) {
      for (const layer of style.layers) {
        if (layer.type === 'symbol' && layer.layout && 'text-font' in layer.layout) {
          layer.layout['text-font'] = ['Montserrat Regular']
        }
      }
    }
    return style
  } catch {
    return url
  }
}

function isWardFeatureCollection(value: unknown): value is WardFeatureCollection {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; features?: unknown }
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features) && candidate.features.length > 0
}

function isZoneBoundaryFeatureCollection(value: unknown): value is ZoneBoundaryFeatureCollection {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; features?: unknown }
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features)
}

function wardBounds(wards: WardFeatureCollection) {
  const bounds = new LngLatBounds()

  function visitCoordinates(value: unknown) {
    if (!Array.isArray(value)) return
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      bounds.extend([value[0], value[1]])
      return
    }
    value.forEach(visitCoordinates)
  }

  wards.features.forEach((feature) => visitCoordinates(feature.geometry.coordinates))
  if (bounds.isEmpty()) throw new Error('Ward geometry contains no usable coordinates.')
  return bounds
}

export function ChennaiMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const boundsRef = useRef<LngLatBounds | null>(null)
  const hoveredIdRef = useRef<FeatureId | null>(null)
  const selectedIdRef = useRef<FeatureId | null>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null)
  const [authorityData, setAuthorityData] = useState<WardCardData | null>(null)
  const [authorityStatus, setAuthorityStatus] = useState<AuthorityStatus>('loading')

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return undefined

    let destroyed = false
    const abortController = new AbortController()
    let map: MapLibreMap | null = null

    const initMap = async () => {
      try {
        const style = await loadBasemapStyle(abortController.signal)
        if (destroyed) return

        map = new MapLibreMap({
          container,
          style,
          center: [...MAP_CONFIG.fallbackCenter] as [number, number],
          zoom: MAP_CONFIG.fallbackZoom,
          attributionControl: { compact: true },
        })
        mapRef.current = map
        map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
        map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right')

        const clearHover = () => {
          if (hoveredIdRef.current !== null && map) {
            map.setFeatureState({ source: WARD_SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
            hoveredIdRef.current = null
          }
          if (map) map.getCanvas().style.cursor = ''
        }

        const clearSelection = () => {
          if (selectedIdRef.current !== null && map) {
            map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: false })
            selectedIdRef.current = null
          }
          setSelectedWard(null)
        }

        const handleMouseMove = (event: MapMouseEvent) => {
          if (!map) return
          const feature = map.queryRenderedFeatures(event.point, { layers: [WARD_FILL_LAYER_ID] })[0]
          const nextId = feature?.id
          if (nextId === undefined) {
            clearHover()
            return
          }

          if (hoveredIdRef.current === nextId) return
          clearHover()
          map.setFeatureState({ source: WARD_SOURCE_ID, id: nextId }, { hover: true })
          hoveredIdRef.current = nextId
          map.getCanvas().style.cursor = 'pointer'
        }

        const handleClick = (event: MapMouseEvent) => {
          if (!map) return
          const feature = map.queryRenderedFeatures(event.point, { layers: [WARD_FILL_LAYER_ID] })[0]
          if (!feature || feature.id === undefined) {
            clearSelection()
            return
          }

          if (selectedIdRef.current !== feature.id) {
            clearSelection()
            map.setFeatureState({ source: WARD_SOURCE_ID, id: feature.id }, { selected: true })
            selectedIdRef.current = feature.id
          }
          setSelectedWard(feature.properties as WardProperties)
        }

        const setupWards = async () => {
          if (!map) return
          try {
            const [wardResponse, zoneResponse] = await Promise.all([
              fetch(MAP_CONFIG.wardDataUrl, { signal: abortController.signal }),
              fetch(MAP_CONFIG.zoneDataUrl, { signal: abortController.signal }),
            ])

            if (!wardResponse.ok) throw new Error('Ward data request failed with status ' + wardResponse.status + '.')

            const wardData: unknown = await wardResponse.json()
            if (!isWardFeatureCollection(wardData)) throw new Error('The ward dataset is not a valid GeoJSON FeatureCollection.')

            const bounds = wardBounds(wardData)
            if (destroyed) return

            addWardLayers(map, wardData)

            if (zoneResponse.ok) {
              const zoneData: unknown = await zoneResponse.json()
              if (isZoneBoundaryFeatureCollection(zoneData)) {
                addZoneLayers(map, zoneData)
              }
            }

            boundsRef.current = bounds
            map.fitBounds(bounds, { padding: { top: 72, right: 72, bottom: 72, left: 72 }, duration: 0, maxZoom: 12 })
            map.on('mousemove', handleMouseMove)
            map.on('click', handleClick)
            map.getCanvas().addEventListener('mouseleave', clearHover)
            setStatus('ready')
          } catch (error) {
            if (destroyed || (error instanceof DOMException && error.name === 'AbortError')) return
            setErrorMessage(error instanceof Error ? error.message : 'The ward map could not be loaded.')
            setStatus('error')
          }
        }

        map.once('load', setupWards)
      } catch (error) {
        if (destroyed || (error instanceof DOMException && error.name === 'AbortError')) return
        setErrorMessage(error instanceof Error ? error.message : 'The basemap could not be loaded.')
        setStatus('error')
      }
    }

    void initMap()

    const loadAuthorityData = async () => {
      try {
        const data = await fetchWardCardData(abortController.signal)
        if (destroyed) return
        setAuthorityData(data)
        setAuthorityStatus('ready')
      } catch (error) {
        if (destroyed || (error instanceof DOMException && error.name === 'AbortError')) return
        setAuthorityStatus('error')
      }
    }
    void loadAuthorityData()

    return () => {
      destroyed = true
      abortController.abort()
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, [])

  const resetMap = () => {
    const map = mapRef.current
    const bounds = boundsRef.current
    if (!map || !bounds) return

    if (selectedIdRef.current !== null) {
      map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: false })
      selectedIdRef.current = null
    }
    setSelectedWard(null)
    map.fitBounds(bounds, { padding: { top: 72, right: 72, bottom: 72, left: 72 }, duration: 700, maxZoom: 12 })
  }

  const deselectWard = () => {
    const map = mapRef.current
    if (map && selectedIdRef.current !== null) {
      map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: false })
      selectedIdRef.current = null
    }
    setSelectedWard(null)
  }

  return (
    <section className="map-shell" aria-label="Interactive Chennai municipal ward map">
      <div className="map-canvas" ref={mapContainerRef} />
      <header className="map-brand">
        <p>Madrasite</p>
        <span>Chennai ward explorer</span>
      </header>
      <div className="map-actions">
        <button type="button" onClick={resetMap} disabled={status !== 'ready'}>
          Return to Chennai
        </button>
      </div>
      <WardInfoPanel
        ward={selectedWard}
        authorityData={authorityData}
        authorityStatus={authorityStatus}
        wardSourceUrl={MAP_CONFIG.wardSourceUrl}
        onDeselect={deselectWard}
      />
      {status === 'loading' && <div className="map-status">Loading validated ward boundaries…</div>}
      {status === 'error' && (
        <div className="map-status map-status--error" role="alert">
          <strong>Map unavailable.</strong> {errorMessage}
        </div>
      )}
    </section>
  )
}
