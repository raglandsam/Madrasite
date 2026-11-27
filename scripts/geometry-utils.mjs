export function roundFeatureCollectionToSixDecimals(featureCollection) {
  function roundCoordinates(coordinates) {
    if (typeof coordinates[0] === 'number') {
      return coordinates.map((coordinate) => Number(coordinate.toFixed(6)))
    }

    return coordinates.map(roundCoordinates)
  }

  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: roundCoordinates(feature.geometry.coordinates),
      },
    })),
  }
}
