import { MAP_CONFIG } from './mapConfig'

/** MapLibre wiring follows once the GCC export is validated. */
export function ChennaiMap() {
  return (
    <section className="map-shell" aria-label="Chennai ward map">
      <div className="map-placeholder">
        <p className="eyebrow">Map foundation</p>
        <h1>Chennai ward map</h1>
        <p>
          The interface is ready for a validated Greater Chennai Corporation
          ward-boundary dataset.
        </p>
        <dl>
          <div>
            <dt>Initial focus</dt>
            <dd>Chennai municipal wards</dd>
          </div>
          <div>
            <dt>Fallback centre</dt>
            <dd>{MAP_CONFIG.fallbackCenter[1]}, {MAP_CONFIG.fallbackCenter[0]}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
