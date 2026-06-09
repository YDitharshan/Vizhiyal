// utils/cityCoords.js
// Static lookup mapping Sri Lankan city names -> { lat, lng }.
// Used to derive VendorProfile.latitude/longitude from the free-text
// `location` field so the recommender can compute haversine distance.
//
// Keep this list in sync with ml-service/data/sl_cities.json and the
// `locations` dropdown in Front-end/src/pages/buyer/SearchVendor.jsx.

export const CITY_COORDS = {
  colombo:      { lat: 6.9271,  lng: 79.8612 },
  kandy:        { lat: 7.2906,  lng: 80.6337 },
  galle:        { lat: 6.0535,  lng: 80.2210 },
  jaffna:       { lat: 9.6615,  lng: 80.0255 },
  negombo:      { lat: 7.2083,  lng: 79.8358 },
  kurunegala:   { lat: 7.4863,  lng: 80.3647 },
  anuradhapura: { lat: 8.3114,  lng: 80.4037 },
  matara:       { lat: 5.9549,  lng: 80.5550 },
  // A few more common cities so free-text entries still resolve.
  batticaloa:   { lat: 7.7170,  lng: 81.7000 },
  trincomalee:  { lat: 8.5874,  lng: 81.2152 },
  ratnapura:    { lat: 6.6828,  lng: 80.3992 },
  badulla:      { lat: 6.9934,  lng: 81.0550 },
  gampaha:      { lat: 7.0917,  lng: 79.9999 },
};

/**
 * Resolve a free-text location string to coordinates.
 * Tries an exact (normalised) match first, then a substring match so values
 * like "Colombo 03" or "Kandy, Central" still resolve.
 * @returns {{ lat: number, lng: number } | null}
 */
export function coordsForLocation(location) {
  if (!location || typeof location !== "string") return null;
  const norm = location.trim().toLowerCase();
  if (!norm) return null;

  if (CITY_COORDS[norm]) return CITY_COORDS[norm];

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (norm.includes(city)) return coords;
  }
  return null;
}
