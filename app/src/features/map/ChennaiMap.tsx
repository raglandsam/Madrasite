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
import { MAP_CONFIG, type MapThemeMode } from './mapConfig'
import { addWardLayers, addZoneLayers, WARD_FILL_LAYER_ID, WARD_SOURCE_ID } from './wardLayers'
import type { WardFeatureCollection, WardProperties, ZoneBoundaryFeatureCollection } from './wardTypes'

setWorkerUrl(workerUrl)

type MapStatus = 'loading' | 'ready' | 'error'
type AuthorityStatus = 'loading' | 'ready' | 'error'
type FeatureId = string | number

async function loadBasemapStyle(mode: MapThemeMode, signal: AbortSignal): Promise<StyleSpecification | string> {
  const url = MAP_CONFIG.basemapStyles[mode]
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
        // Apply Montserrat Regular to all vector symbol text labels
        if (layer.type === 'symbol' && layer.layout && 'text-font' in layer.layout) {
          layer.layout['text-font'] = ['Montserrat Regular']
        }

        if (mode === 'dark') {
          // Amplify water bodies
          if (layer.id === 'water' && layer.type === 'fill' && layer.paint) {
            layer.paint['fill-color'] = '#103444'
          }
          if (layer.id === 'waterway' && layer.type === 'line' && layer.paint) {
            layer.paint['line-color'] = '#16485e'
          }
          // Lighten place & street names for high contrast
          if (layer.type === 'symbol' && layer.paint) {
            if (layer.id.startsWith('place_') || layer.id.startsWith('highway_name')) {
              layer.paint['text-color'] = '#e2e8f0'
              layer.paint['text-halo-color'] = '#050b0d'
              layer.paint['text-halo-width'] = 1.6
            }
          }
        } else {
          // Light Mode (Mild Green Palette)
          if (layer.type === 'background' && layer.paint) {
            layer.paint['background-color'] = '#f3f6f1'
          }
          if (layer.id === 'water' && layer.type === 'fill' && layer.paint) {
            layer.paint['fill-color'] = '#b6d7d4'
          }
          if (layer.id === 'waterway' && layer.type === 'line' && layer.paint) {
            layer.paint['line-color'] = '#9ac2be'
          }
          if (layer.type === 'symbol' && layer.paint) {
            if (layer.id.includes('place') || layer.id.includes('highway') || layer.id.includes('road')) {
              layer.paint['text-color'] = '#1c3624'
              layer.paint['text-halo-color'] = '#ffffff'
              layer.paint['text-halo-width'] = 1.5
            }
          }
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
  const wardDataRef = useRef<WardFeatureCollection | null>(null)
  const zoneDataRef = useRef<ZoneBoundaryFeatureCollection | null>(null)

  const [themeMode, setThemeMode] = useState<MapThemeMode>(() => {
    const saved = localStorage.getItem('madrasite_theme')
    return saved === 'light' ? 'light' : 'dark'
  })
  const [status, setStatus] = useState<MapStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null)
  const [authorityData, setAuthorityData] = useState<WardCardData | null>(null)
  const [authorityStatus, setAuthorityStatus] = useState<AuthorityStatus>('loading')

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(nextMode)
    localStorage.setItem('madrasite_theme', nextMode)
  }

  // Load authority data once on mount
  useEffect(() => {
    const abortController = new AbortController()
    let destroyed = false

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
    }
  }, [])

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let destroyed = false
    const abortController = new AbortController()
    let map: MapLibreMap | null = null

    const initMap = async () => {
      try {
        setStatus('loading')
        const style = await loadBasemapStyle(themeMode, abortController.signal)
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
          const features = map.queryRenderedFeatures(event.point, { layers: [WARD_FILL_LAYER_ID] })
          const nextFeature = features[0]

          if (!nextFeature) {
            clearHover()
            return
          }

          const nextId = nextFeature.id ?? (nextFeature.properties?.ward_id as FeatureId | undefined)
          if (nextId === undefined) {
            clearHover()
            return
          }

          map.getCanvas().style.cursor = 'pointer'
          if (hoveredIdRef.current !== nextId) {
            if (hoveredIdRef.current !== null) {
              map.setFeatureState({ source: WARD_SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
            }
            hoveredIdRef.current = nextId
            map.setFeatureState({ source: WARD_SOURCE_ID, id: nextId }, { hover: true })
          }
        }

        const handleClick = (event: MapMouseEvent) => {
          if (!map) return
          const features = map.queryRenderedFeatures(event.point, { layers: [WARD_FILL_LAYER_ID] })
          const nextFeature = features[0]

          if (!nextFeature) {
            clearSelection()
            return
          }

          const nextId = nextFeature.id ?? (nextFeature.properties?.ward_id as FeatureId | undefined)
          if (nextId === undefined) {
            clearSelection()
            return
          }

          if (selectedIdRef.current !== null) {
            map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: false })
          }

          selectedIdRef.current = nextId
          map.setFeatureState({ source: WARD_SOURCE_ID, id: nextId }, { selected: true })
          setSelectedWard(nextFeature.properties as WardProperties)
        }

        const setupWards = async () => {
          if (!map) return
          try {
            let wardData = wardDataRef.current
            let zoneData = zoneDataRef.current

            if (!wardData) {
              const [wardResponse, zoneResponse] = await Promise.all([
                fetch(MAP_CONFIG.wardDataUrl, { signal: abortController.signal }),
                fetch(MAP_CONFIG.zoneDataUrl, { signal: abortController.signal }),
              ])

              if (!wardResponse.ok) throw new Error('Ward data request failed with status ' + wardResponse.status + '.')

              const parsedWards: unknown = await wardResponse.json()
              if (!isWardFeatureCollection(parsedWards)) throw new Error('The ward dataset is not a valid GeoJSON FeatureCollection.')

              wardData = parsedWards
              wardDataRef.current = parsedWards

              if (zoneResponse.ok) {
                const parsedZones: unknown = await zoneResponse.json()
                if (isZoneBoundaryFeatureCollection(parsedZones)) {
                  zoneData = parsedZones
                  zoneDataRef.current = parsedZones
                }
              }
            }

            const bounds = boundsRef.current ?? wardBounds(wardData)
            boundsRef.current = bounds
            if (destroyed) return

            addWardLayers(map, wardData, themeMode)
            if (zoneData) {
              addZoneLayers(map, zoneData, themeMode)
            }

            // Restore selection feature state if a ward was already selected
            if (selectedIdRef.current !== null) {
              map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: true })
            }

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

    return () => {
      destroyed = true
      abortController.abort()
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, [themeMode])

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
    <section className={`map-shell theme-${themeMode}`} aria-label="Interactive Chennai municipal ward map">
      <div className="map-canvas" ref={mapContainerRef} />

      {/* Top Header Bar */}
      <header className="site-header-bar" role="banner">
        <div className="site-header-left">
          <span className="brand-logo" aria-hidden="true">🏛️</span>
          <div className="brand-titles">
            <h1 className="brand-name">Madrasite</h1>
            <span className="brand-subtitle">Chennai Ward &amp; Civic Map</span>
          </div>
          <span className="badge-v0">v0</span>
        </div>

        <div className="site-header-center">
          <span className="header-status-pill">
            <span className="status-dot-active" aria-hidden="true"></span>
            200 GCC Wards &bull; 15 Zones
          </span>
        </div>

        <div className="site-header-right">
          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            className="theme-toggle-header-btn"
            onClick={toggleTheme}
            disabled={status !== 'ready'}
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {themeMode === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className="theme-toggle-text">
              {themeMode === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            type="button"
            className="header-action-btn"
            onClick={resetMap}
            disabled={status !== 'ready'}
            title="Reset map view to entire Chennai"
          >
            <span>⟲</span> Return to Chennai
          </button>
        </div>
      </header>

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
