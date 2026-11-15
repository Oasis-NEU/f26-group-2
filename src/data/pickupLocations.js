// Pickup spot (as saved on a listing) → what to search for on the map.
// These are general campus spots only. "Other" isn't a place, so it gets no map.
// When a spot is added to SELL_PICKUP_SPOTS in sellOptions.ts, add it here too,
// or its listings just won't show a map.
const CAMPUS = 'Northeastern University, Boston, MA'

const MAP_QUERIES = {
  'Curry Student Center': `Curry Student Center, ${CAMPUS}`,
  'Snell Library': `Snell Library, ${CAMPUS}`,
  ISEC: `Interdisciplinary Science and Engineering Complex, ${CAMPUS}`,
  EXP: `EXP, ${CAMPUS}`,
  'Krentzman Quad': `Krentzman Quadrangle, ${CAMPUS}`,
  'Centennial Commons': `Centennial Common, ${CAMPUS}`,
  'Marino Center': `Marino Recreation Center, ${CAMPUS}`,
  'International Village': `International Village, ${CAMPUS}`,
  'Stetson East': `Stetson East Hall, ${CAMPUS}`,
  'Stetson West': `Stetson West Hall, ${CAMPUS}`,
  'Speare Hall': `Speare Hall, ${CAMPUS}`,
  'West Village Quad': `West Village, ${CAMPUS}`,
}

// Close enough to pick out the building.
const ZOOM = 17

// Optional. Without a key the map uses Google's keyless embed, which works but
// isn't an official API and could change. For launch, create a free "Maps
// Embed API" key in Google Cloud, restrict it to the site's domains, and set
// VITE_GOOGLE_MAPS_EMBED_KEY (in .env locally and in Vercel). The key ends up
// in the browser bundle; the domain restriction is what protects it.
const EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY

// Returns map links for a pickup spot, or null when there's nothing to show.
export function pickupMapFor(spot) {
  const query = MAP_QUERIES[spot]
  if (!query) return null

  const q = encodeURIComponent(query)
  return {
    embedUrl: EMBED_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=${q}&zoom=${ZOOM}`
      : `https://www.google.com/maps?q=${q}&z=${ZOOM}&output=embed`,
    googleUrl: `https://www.google.com/maps/search/?api=1&query=${q}`,
    appleUrl: `https://maps.apple.com/?q=${q}`,
  }
}
