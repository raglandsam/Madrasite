import { lazy, Suspense } from 'react'
import './App.css'

const ChennaiMap = lazy(async () => {
  const module = await import('./features/map/ChennaiMap')
  return { default: module.ChennaiMap }
})

function App() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="map-shell map-shell--loading" role="status" aria-label="Loading Chennai ward map">
            <span className="map-loading-dot" aria-hidden="true" />
          </div>
        }
      >
        <ChennaiMap />
      </Suspense>
    </main>
  )
}

export default App
