import { useEffect, useRef, useState } from 'react'
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchWardCardData } from './authorityData'
import type { WardCardData } from './authorityTypes'
import { WardInfoPanel } from './WardInfoPanel'
import { I18N_STRINGS, type AppLanguage } from './i18n'
import { MAP_CONFIG, type MapThemeMode } from './mapConfig'
import { addWardLayers, addZoneLayers, WARD_FILL_LAYER_ID, WARD_SOURCE_ID } from './wardLayers'
import type { WardFeatureCollection, WardProperties, ZoneBoundaryFeatureCollection } from './wardTypes'

setWorkerUrl(workerUrl)

type MapStatus = 'loading' | 'ready' | 'error'
type AuthorityStatus = 'loading' | 'ready' | 'error'
type FeatureId = string | number

/* Minimalist Vector Icons (Zero Emojis) */
function CivicLogoIcon() {
  return (
    <svg className="brand-logo-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="theme-toggle-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="theme-toggle-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function ResetViewIcon() {
  return (
    <svg className="action-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

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

    // Use glyphs supporting both Latin and Tamil character sets
    style.glyphs = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

    // Bilingual Place/Region text-field expression: English on line 1, Tamil on line 2
    const bilingualTextField = [
      'case',
      ['all', ['has', 'name:latin'], ['has', 'name:nonlatin']],
      ['concat', ['get', 'name:latin'], '\n', ['get', 'name:nonlatin']],
      ['all', ['has', 'name_en'], ['has', 'name:ta']],
      ['concat', ['get', 'name_en'], '\n', ['get', 'name:ta']],
      ['all', ['has', 'name_en'], ['has', 'name_ta']],
      ['concat', ['get', 'name_en'], '\n', ['get', 'name:ta']],
      ['has', 'name:nonlatin'],
      ['concat', ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']], '\n', ['get', 'name:nonlatin']],
      ['coalesce', ['get', 'name_en'], ['get', 'name']],
    ]

    if (Array.isArray(style.layers)) {
      for (const layer of style.layers) {
        if (layer.type === 'symbol') {
          // Use Noto Sans Regular for complete Tamil Unicode coverage
          if (layer.layout && 'text-font' in layer.layout) {
            layer.layout['text-font'] = ['Noto Sans Regular']
          }

          // Apply dual-language labels to all place, region, and suburb description layers
          if (
            layer.id.startsWith('place_') ||
            layer.id.includes('city') ||
            layer.id.includes('town') ||
            layer.id.includes('village') ||
            layer.id.includes('suburb') ||
            layer.id.includes('neighborhood')
          ) {
            if (layer.layout) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              layer.layout['text-field'] = bilingualTextField as any
            }
          }
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
  const authorityDataRef = useRef<WardCardData | null>(null)
  const rafHoverRef = useRef<number | null>(null)

  const [themeMode, setThemeMode] = useState<MapThemeMode>(() => {
    const saved = localStorage.getItem('madrasite_theme')
    return saved === 'light' ? 'light' : 'dark'
  })
  const themeModeRef = useRef<MapThemeMode>(themeMode)

  const [lang, setLang] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('madrasite_lang')
    return saved === 'ta' ? 'ta' : 'en'
  })

  const [status, setStatus] = useState<MapStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null)
  const [authorityData, setAuthorityData] = useState<WardCardData | null>(null)
  const [authorityStatus, setAuthorityStatus] = useState<AuthorityStatus>('loading')

  const t = I18N_STRINGS[lang]

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark'
    themeModeRef.current = nextMode
    setThemeMode(nextMode)
    localStorage.setItem('madrasite_theme', nextMode)
  }

  const toggleLang = () => {
    const nextLang: AppLanguage = lang === 'en' ? 'ta' : 'en'
    setLang(nextLang)
    localStorage.setItem('madrasite_lang', nextLang)
  }

  // Load authority data only after the first ward selection.
  useEffect(() => {
    if (!selectedWard || authorityData) return

    const abortController = new AbortController()
    let destroyed = false

    const loadAuthorityData = async () => {
      try {
        const data = await fetchWardCardData(abortController.signal)
        if (destroyed) return
        authorityDataRef.current = data
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
  }, [selectedWard, authorityData])

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let destroyed = false
    const abortController = new AbortController()
    let map: MapLibreMap | null = null

    const initMap = async () => {
      try {
        setStatus('loading')
        const style = await loadBasemapStyle(themeModeRef.current, abortController.signal)
        if (destroyed) return

        map = new MapLibreMap({
          container,
          style,
          center: [...MAP_CONFIG.fallbackCenter] as [number, number],
          zoom: MAP_CONFIG.fallbackZoom,
          minZoom: MAP_CONFIG.minimumZoom,
          maxZoom: MAP_CONFIG.maximumZoom,
          maxBounds: MAP_CONFIG.viewportBounds,
          dragRotate: false,
          pitchWithRotate: false,
          attributionControl: { compact: true },
        })
        mapRef.current = map
        map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
        map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right')

        const clearHover = () => {
          if (rafHoverRef.current !== null) {
            cancelAnimationFrame(rafHoverRef.current)
            rafHoverRef.current = null
          }
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

        // High-performance layer-targeted hover with requestAnimationFrame batching
        const handleWardMouseMove = (event: MapLayerMouseEvent) => {
          if (!map) return
          const feature = event.features?.[0]
          if (!feature) return

          const nextId = feature.id ?? (feature.properties?.ward_id as FeatureId | undefined)
          if (nextId === undefined || nextId === hoveredIdRef.current) return

          map.getCanvas().style.cursor = 'pointer'

          if (rafHoverRef.current !== null) {
            cancelAnimationFrame(rafHoverRef.current)
          }

          rafHoverRef.current = requestAnimationFrame(() => {
            if (!map) return
            if (hoveredIdRef.current !== null) {
              map.setFeatureState({ source: WARD_SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
            }
            hoveredIdRef.current = nextId
            map.setFeatureState({ source: WARD_SOURCE_ID, id: nextId }, { hover: true })
            rafHoverRef.current = null
          })
        }

        const handleWardMouseLeave = () => {
          clearHover()
        }

        const handleWardClick = (event: MapLayerMouseEvent) => {
          if (!map) return
          const feature = event.features?.[0]
          if (!feature) {
            clearSelection()
            return
          }

          const nextId = feature.id ?? (feature.properties?.ward_id as FeatureId | undefined)
          if (nextId === undefined) {
            clearSelection()
            return
          }

          if (selectedIdRef.current !== null) {
            map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: false })
          }

          selectedIdRef.current = nextId
          map.setFeatureState({ source: WARD_SOURCE_ID, id: nextId }, { selected: true })
          if (!authorityDataRef.current) setAuthorityStatus('loading')
          setSelectedWard(feature.properties as WardProperties)
        }

        const handleMapClick = (event: MapMouseEvent) => {
          if (!map) return
          // Deselect when clicking outside any ward polygon
          const hits = map.queryRenderedFeatures(event.point, { layers: [WARD_FILL_LAYER_ID] })
          if (hits.length === 0) {
            clearSelection()
          }
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

            addWardLayers(map, wardData, themeModeRef.current)
            if (zoneData) {
              addZoneLayers(map, zoneData, themeModeRef.current)
            }

            // Restore selection feature state if a ward was already selected
            if (selectedIdRef.current !== null) {
              map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: true })
            }

            map.fitBounds(bounds, { padding: { top: 72, right: 72, bottom: 72, left: 72 }, duration: 0, maxZoom: 12 })

            // Layer-targeted listeners prevent full-canvas mousemove overhead
            map.on('mousemove', WARD_FILL_LAYER_ID, handleWardMouseMove)
            map.on('mouseleave', WARD_FILL_LAYER_ID, handleWardMouseLeave)
            map.on('click', WARD_FILL_LAYER_ID, handleWardClick)
            map.on('click', handleMapClick)

            setStatus('ready')
          } catch (error) {
            if (destroyed || (error instanceof DOMException && error.name === 'AbortError')) return
            setErrorMessage(error instanceof Error ? error.message : 'The ward map could not be loaded.')
            setStatus('error')
          }
        }

        map.once('style.load', setupWards)
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
      if (rafHoverRef.current !== null) {
        cancelAnimationFrame(rafHoverRef.current)
        rafHoverRef.current = null
      }
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const abortController = new AbortController()

    const applyTheme = async () => {
      try {
        const style = await loadBasemapStyle(themeMode, abortController.signal)
        if (abortController.signal.aborted) return

        map.setStyle(style)
        map.once('style.load', () => {
          const wardData = wardDataRef.current
          const zoneData = zoneDataRef.current
          if (wardData) addWardLayers(map, wardData, themeMode)
          if (zoneData) addZoneLayers(map, zoneData, themeMode)

          if (selectedIdRef.current !== null) {
            map.setFeatureState({ source: WARD_SOURCE_ID, id: selectedIdRef.current }, { selected: true })
          }
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorMessage(error instanceof Error ? error.message : 'The map theme could not be changed.')
        setStatus('error')
      }
    }

    void applyTheme()

    return () => abortController.abort()
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
          <span className="brand-logo" aria-hidden="true">
            <CivicLogoIcon />
          </span>
          <div className="brand-titles">
            <h1 className="brand-name">Madrasite</h1>
            <span className="brand-subtitle">{t.brandSubtitle}</span>
          </div>
          <span className="badge-v0">v0</span>
        </div>

        <div className="site-header-center">
          <span className="header-status-pill">
            <span className="status-dot-active" aria-hidden="true"></span>
            {t.statusPill}
          </span>
        </div>

        <div className="site-header-right">
          {/* Language Mode Toggle Button */}
          <button
            type="button"
            className="lang-toggle-header-btn"
            onClick={toggleLang}
            title={t.langToggleTitle}
            aria-label={t.langToggleTitle}
          >
            <span className="lang-toggle-text">{t.langToggle}</span>
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            className="theme-toggle-header-btn"
            onClick={toggleTheme}
            disabled={status !== 'ready'}
            title={`Switch to ${themeMode === 'dark' ? t.themeLight : t.themeDark} Mode`}
            aria-label={`Switch to ${themeMode === 'dark' ? t.themeLight : t.themeDark} Mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </span>
            <span className="theme-toggle-text">
              {themeMode === 'dark' ? t.themeLight : t.themeDark}
            </span>
          </button>

          <button
            type="button"
            className="header-action-btn"
            onClick={resetMap}
            disabled={status !== 'ready'}
            title={t.returnToChennai}
          >
            <ResetViewIcon />
            <span>{t.returnToChennai}</span>
          </button>
        </div>
      </header>

      <WardInfoPanel
        ward={selectedWard}
        authorityData={authorityData}
        authorityStatus={authorityStatus}
        wardSourceUrl={MAP_CONFIG.wardSourceUrl}
        lang={lang}
        onDeselect={deselectWard}
      />

      {status === 'loading' && <div className="map-status">{t.loadingBoundaries}</div>}
      {status === 'error' && (
        <div className="map-status map-status--error" role="alert">
          <strong>{t.mapUnavailable}</strong> {errorMessage}
        </div>
      )}
    </section>
  )
}
